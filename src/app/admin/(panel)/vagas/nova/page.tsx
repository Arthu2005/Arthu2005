import { selectDistinct } from "../_departments";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader } from "@/components/admin/ui";
import { JobEditor } from "@/components/admin/JobEditor";

export const metadata = { title: "Nova vaga" };

export default async function NewJob() {
  await requirePage("jobs.manage");
  return (
    <>
      <AdminHeader title="Nova vaga" back={{ href: "/admin/vagas", label: "Vagas" }} />
      <JobEditor departments={await selectDistinct()} />
    </>
  );
}
