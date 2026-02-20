import React, { useMemo, useState } from "react";
import { Autocomplete, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { listUsers, AdminUser } from "../../iam/api";

export type AssigneeOption = {
  id: string;
  label: string;
  role?: string;
};

const toOption = (user: AdminUser): AssigneeOption => ({
  id: String(user.id),
  label: user.email,
  role: user.role,
});

export const AssigneeSelect: React.FC<{
  value: AssigneeOption | null;
  onChange: (value: AssigneeOption | null) => void;
  label?: string;
  helperText?: string;
}> = ({ value, onChange, label, helperText }) => {
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["assignees", inputValue, tokens?.accessToken],
    queryFn: () =>
      listUsers(tokens?.accessToken || "", {
        search: inputValue || undefined,
        is_staff: true,
        page_size: 20,
      }),
    enabled: Boolean(tokens?.accessToken),
  });

  const options = useMemo(
    () => (data?.results || []).map(toOption),
    [data?.results]
  );

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={value}
      onChange={(_, next) => onChange(next)}
      inputValue={inputValue}
      onInputChange={(_, next) => setInputValue(next)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => option.label}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack>
            <Typography variant="body2">{option.label}</Typography>
            {option.role && (
              <Typography variant="caption" color="text.secondary">
                {t(`iam.roles.${option.role}`, option.role)}
              </Typography>
            )}
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label || t("tickets.assignee")}
          helperText={helperText || t("tickets.assignee.helper")}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

