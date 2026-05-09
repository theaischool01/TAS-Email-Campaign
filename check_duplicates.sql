-- Check for duplicate campaigns (createdBy, name)
SELECT 
    "createdBy",
    name,
    COUNT(*) as duplicate_count,
    STRING_AGG("createdAt", ', ' ORDER BY "createdAt"') as duplicate_ids,
    MIN("createdAt") as oldest_created
FROM campaigns 
GROUP BY "createdBy", name 
HAVING COUNT(*) > 1 
ORDER BY duplicate_count DESC, oldest_created;

-- Check for duplicate templates (createdBy, name)  
SELECT 
    "createdBy",
    name,
    COUNT(*) as duplicate_count,
    STRING_AGG("createdAt", ', ' ORDER BY "createdAt"') as duplicate_ids,
    MIN("createdAt") as oldest_created
FROM email_templates 
GROUP BY "createdBy", name 
HAVING COUNT(*) > 1 
ORDER BY duplicate_count DESC, oldest_created;

-- Check for potential corrupted drafts (old drafts with no recent activity)
SELECT 
    id,
    name,
    status,
    "createdAt",
    "updatedAt",
    EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) as age_hours
FROM campaigns 
WHERE status = 'DRAFT' 
    AND "createdAt" < NOW() - INTERVAL '7 days'
ORDER BY "createdAt";
