import { prisma as prismaClient } from "@/app/lib/prisma";
import { SegmentQueryCompiler } from "@/lib/segments/compiler";
import { validateCriteriaNode, CustomFieldMeta } from "@/lib/segments/validator";
import { translateLegacyToCriteria } from "@/lib/segments/translator";

const prisma = prismaClient as any;

export interface CampaignConfig {
  listIds?: string[];
  includedTags?: string[];
  segmentIds?: string[];
  segments?: any[]; // Allow pre-loaded segments
  excludedTags?: string[];
  audienceFilters?: any;
}

export class CampaignAudienceService {
  /**
   * Builds the unified AST criteria conjoining Lists, Segments, and Excluded Tags.
   * Formula: (List/Tag Union) AND (Segment Union) AND (NOT Excluded Tags)
   */
  static compileCampaignCriteria(config: CampaignConfig): any {
    const { listIds = [], includedTags = [], segments = [], segmentIds = [], excludedTags = [], audienceFilters } = config;

    const subFilters: any[] = [];

    // 1. List/Tag union
    if (listIds.length > 0 || includedTags.length > 0) {
      const listTagAst = translateLegacyToCriteria(listIds, includedTags);
      if (listTagAst && listTagAst.rules && listTagAst.rules.length > 0) {
        subFilters.push(listTagAst);
      }
    }

    // 2. Segment union (Combined with OR conjunction)
    const activeSegments = segments.length > 0 ? segments : [];
    
    // In case segments weren't preloaded, we will handle that at high level or database loader
    const segmentRules = activeSegments
      .map(s => s.criteria)
      .filter(Boolean);

    if (segmentRules.length > 0) {
      if (segmentRules.length === 1) {
        subFilters.push(segmentRules[0]);
      } else {
        subFilters.push({
          conjunction: "OR",
          rules: segmentRules
        });
      }
    }

    // 3. Excluded tags
    if (excludedTags.length > 0) {
      const exclusionRules = excludedTags.map(tag => ({
        type: "RULE",
        field: "contact.tags",
        operator: "not_equals",
        value: tag
      }));
      subFilters.push(...exclusionRules);
    }

    // 4. Custom audience filters
    if (audienceFilters && audienceFilters.rules && audienceFilters.rules.length > 0) {
      subFilters.push(audienceFilters);
    }

    if (subFilters.length === 0) {
      return null;
    }

    if (subFilters.length === 1) {
      return subFilters[0];
    }

    return {
      conjunction: "AND",
      rules: subFilters
    };
  }

  /**
   * Helper to load custom field registry and resolve segment IDs
   */
  private static async prepareContext(userId: string, config: CampaignConfig) {
    // 1. Load preloaded segments if not provided
    let loadedSegments = config.segments || [];
    const neededSegmentIds = (config.segmentIds || []).filter(
      id => !loadedSegments.some(s => s.id === id)
    );

    if (neededSegmentIds.length > 0) {
      const segmentsFromDb = await prisma.segment.findMany({
        where: { id: { in: neededSegmentIds }, userId }
      });
      loadedSegments = [...loadedSegments, ...segmentsFromDb];
    }

    // 2. Load custom field metadata registry
    const dbCustomFields = await prisma.contactCustomField.findMany({
      where: { userId }
    });

    const fieldRegistry = new Map<string, CustomFieldMeta>(
      dbCustomFields.map((cf: any) => [
        cf.key.toLowerCase(),
        { id: cf.id, key: cf.key, type: cf.type }
      ])
    );

    // 3. Compile criteria
    const criteria = this.compileCampaignCriteria({
      ...config,
      segments: loadedSegments
    });

    if (criteria) {
      validateCriteriaNode(criteria, fieldRegistry);
    }

    return { criteria, fieldRegistry };
  }

  /**
   * Gets estimated count of active recipients (excluding suppressed)
   */
  static async getEstimateCount(userId: string, config: CampaignConfig): Promise<number> {
    const { criteria, fieldRegistry } = await this.prepareContext(userId, config);
    if (!criteria) {
      return 0;
    }

    let { sql, values } = SegmentQueryCompiler.compile(userId, criteria, fieldRegistry, {
      mode: "COUNT"
    });

    // Exclude suppression list
    sql += ` AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $1)`;

    const totalResult = await prisma.$queryRawUnsafe(sql, ...values);
    return Number(totalResult[0]?.count || 0);
  }

  /**
   * Streams/pages matching contacts
   */
  static async streamRecipients(
    userId: string,
    config: CampaignConfig,
    options: { cursorId?: string; batchSize?: number }
  ): Promise<any[]> {
    const { criteria, fieldRegistry } = await this.prepareContext(userId, config);
    if (!criteria) {
      return [];
    }

    let { sql, values } = SegmentQueryCompiler.compile(userId, criteria, fieldRegistry, {
      mode: "STREAM",
      cursorId: options.cursorId,
      batchSize: options.batchSize || 1000
    });

    // Exclude suppression list in SQL stream too.
    // Replace "ORDER BY" with "AND c.email NOT IN ... ORDER BY" so that c.email suppression is checked before sorting/limiting.
    sql = sql.replace("ORDER BY", `AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $1) ORDER BY`);

    const rawResults = await prisma.$queryRawUnsafe(sql, ...values) as Array<{ id: string }>;
    if (rawResults.length === 0) return [];

    const contactIds = rawResults.map(r => r.id);

    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      include: {
        customFieldValues: {
          include: {
            customField: true
          }
        },
        contactTags: {
          include: {
            tag: true
          }
        }
      }
    });

    const contactMap = new Map<string, any>(contacts.map((c: any) => [c.id, c]));
    return contactIds.map(id => contactMap.get(id)).filter(Boolean);
  }
}
