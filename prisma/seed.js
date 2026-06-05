async function main() {
  console.log("Database seeded successfully.")
  console.log("To create an admin user, run the following command:")
  console.log("npx ts-node scripts/create-admin.ts <email> <password> <name>")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
