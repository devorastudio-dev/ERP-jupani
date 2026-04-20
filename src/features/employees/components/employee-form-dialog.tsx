"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import type { EmployeeRow } from "@/types/entities";

interface EmployeeFormDialogProps {
  employee: EmployeeRow;
  allowSalary: boolean;
}

export function EmployeeFormDialog({ employee, allowSalary }: EmployeeFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar funcionário</DialogTitle>
          <DialogDescription>
            Atualize cargo, remuneração, contato e status do colaborador.
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm allowSalary={allowSalary} employee={employee} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
