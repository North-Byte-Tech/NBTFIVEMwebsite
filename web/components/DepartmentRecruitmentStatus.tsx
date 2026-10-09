"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { DepartmentCode } from "@/lib/departments";
import { getDepartmentRecruitmentOpen } from "@/lib/applicationTypes";

export function DepartmentRecruitmentStatus({ departmentCode }: { departmentCode: DepartmentCode }) {
  const [open, setOpen] = useState(() => getDepartmentRecruitmentOpen(departmentCode));

  useEffect(() => {
    const sync = () => setOpen(getDepartmentRecruitmentOpen(departmentCode));

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("nbt-form-builder-updated", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nbt-form-builder-updated", sync);
    };
  }, [departmentCode]);

  return <>{open ? "Open" : "Closed"}</>;
}

export function DepartmentRecruitmentPill({ departmentCode }: { departmentCode: DepartmentCode }) {
  const [open, setOpen] = useState(() => getDepartmentRecruitmentOpen(departmentCode));

  useEffect(() => {
    const sync = () => setOpen(getDepartmentRecruitmentOpen(departmentCode));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("nbt-form-builder-updated", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nbt-form-builder-updated", sync);
    };
  }, [departmentCode]);

  return <Badge tone={open ? "success" : "neutral"}>{open ? "Recruiting" : "Closed"}</Badge>;
}

export function DepartmentRecruitmentGate({
  departmentCode,
  children,
  fallback,
}: {
  departmentCode: DepartmentCode;
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => getDepartmentRecruitmentOpen(departmentCode));

  useEffect(() => {
    const sync = () => setOpen(getDepartmentRecruitmentOpen(departmentCode));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("nbt-form-builder-updated", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nbt-form-builder-updated", sync);
    };
  }, [departmentCode]);

  return <>{open ? children : fallback}</>;
}
