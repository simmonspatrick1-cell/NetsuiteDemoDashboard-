import { Dashboard } from "@/components/dashboard/dashboard";
import { initializeDatabase } from "@/lib/db";
import {
  getProspects,
  getCustomers,
  getServiceItems,
  getProjects,
  getTasks,
  getEntityCounts,
} from "@/lib/demo-data";

export default async function Home() {
  await initializeDatabase();

  const [counts, prospects, customers, serviceItems, projects, tasks] =
    await Promise.all([
      getEntityCounts(),
      getProspects(),
      getCustomers(),
      getServiceItems(),
      getProjects(),
      getTasks(),
    ]);

  return (
    <Dashboard
      initialData={{
        counts,
        prospects,
        customers,
        serviceItems,
        projects,
        tasks,
      }}
    />
  );
}
