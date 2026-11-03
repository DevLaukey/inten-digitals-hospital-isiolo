"use client";
import { useParams } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import { ErrorNote, Loading, PageHeader } from "@/components/ui";
import { getItem } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function EditItemPage() {
  const { id } = useParams();
  const { data: item, loading, error } = useLoad(() => getItem(id), [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <>
      <PageHeader title="Edit item" subtitle={item.id} />
      <ItemForm item={item} />
    </>
  );
}
