import React, { Fragment } from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ROUTE_LABEL_MAP } from "../moduleRegistry";

export const BreadcrumbsBar: React.FC<{ path: string }> = ({ path }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const segments = path.split("/").filter(Boolean);
  const crumbs = segments.reduce<string[]>((acc, segment) => {
    const prev = acc[acc.length - 1] || "";
    const next = `${prev}/${segment}`;
    acc.push(next);
    return acc;
  }, []);

  const fullCrumbs = ["/", ...crumbs];

  return (
    <Breadcrumbs
      sx={{
        mb: 2,
        "& .MuiBreadcrumbs-separator": {
          color: "text.disabled",
        },
      }}
    >
      {fullCrumbs.map((crumb, index) => {
        const labelKey = ROUTE_LABEL_MAP[crumb];
        const label = labelKey ? t(labelKey) : crumb.replace("/", "");
        const isLast = index === fullCrumbs.length - 1;

        return isLast ? (
          <Typography key={crumb} variant="body2" color="text.primary">
            {label}
          </Typography>
        ) : (
          <Link
            key={crumb}
            underline="none"
            variant="body2"
            color="text.secondary"
            onClick={() => navigate(crumb === "/" ? "/" : crumb)}
            sx={{ cursor: "pointer" }}
          >
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};
