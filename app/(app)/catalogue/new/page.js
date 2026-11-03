"use client";
import ItemForm from "@/components/ItemForm";
import { PageHeader } from "@/components/ui";

export default function NewItemPage() {
  return (
    <>
      <PageHeader title="Add service or drug" />
      <ItemForm />
    </>
  );
}
