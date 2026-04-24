import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH } from "@/lib/route-config";

export default function AdminIndexPage() {
  redirect(`${ADMIN_BASE_PATH}/dashboard`);
}
