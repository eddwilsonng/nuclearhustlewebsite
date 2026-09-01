"use client";

import { Company } from "@/lib/types";
import { JobCategory } from "@/lib/categorize";
import { Button } from "@/components/ui/Button";
import {
  FieldGroup,
  FieldLabel,
  Input,
  Select,
} from "@/components/ui/Field";

interface CategoryOption {
  category: JobCategory;
  name: string;
  count: number;
}

interface FilterSidebarProps {
  companies: Company[];
  categories: CategoryOption[];
  selectedCompany: string | null;
  selectedCategory: JobCategory | null;
  searchQuery: string;
  resultCount: number;
  totalCount: number;
  onCompanyChange: (companyId: string | null) => void;
  onCategoryChange: (category: JobCategory | null) => void;
  onSearchChange: (query: string) => void;
}

export function FilterSidebar({
  companies,
  categories,
  selectedCompany,
  selectedCategory,
  searchQuery,
  resultCount,
  totalCount,
  onCompanyChange,
  onCategoryChange,
  onSearchChange,
}: FilterSidebarProps) {
  const hasActiveFilters = Boolean(
    selectedCompany || selectedCategory || searchQuery,
  );
  const selectedCategoryName = categories.find(
    (c) => c.category === selectedCategory,
  )?.name;
  const selectedCompanyName = companies.find(
    (c) => c.id === selectedCompany,
  )?.name;

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...(searchQuery
      ? [{ label: `“${searchQuery}”`, onRemove: () => onSearchChange("") }]
      : []),
    ...(selectedCategoryName
      ? [{ label: selectedCategoryName, onRemove: () => onCategoryChange(null) }]
      : []),
    ...(selectedCompanyName
      ? [{ label: selectedCompanyName, onRemove: () => onCompanyChange(null) }]
      : []),
  ];

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="border border-rule lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <p className="font-sans text-sm font-semibold text-ink">Filter</p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="quiet"
              size="compact"
              onClick={() => {
                onCompanyChange(null);
                onCategoryChange(null);
                onSearchChange("");
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-rule px-4 py-3">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className="flex min-h-8 items-center gap-1 border border-signal bg-signal/20 px-2 py-1 font-sans text-sm text-ink"
              >
                <span className="max-w-[10rem] truncate">{chip.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-5 p-4">
          <FieldGroup>
            <FieldLabel htmlFor="search">Search</FieldLabel>
            <Input
              type="search"
              id="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Job title or location"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="category">Role</FieldLabel>
            <Select
              id="category"
              value={selectedCategory || ""}
              onChange={(e) =>
                onCategoryChange((e.target.value as JobCategory) || null)
              }
            >
              <option value="">All roles</option>
              {categories.map(({ category, name, count }) => (
                <option key={category} value={category}>
                  {name} ({count})
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="company">Company</FieldLabel>
            <Select
              id="company"
              value={selectedCompany || ""}
              onChange={(e) => onCompanyChange(e.target.value || null)}
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>

        <div className="border-t border-rule px-4 py-3" aria-live="polite">
          <p className="font-mono text-xs text-secondary">
            {hasActiveFilters ? (
              <>
                <span className="font-semibold tabular-nums text-ink">
                  {resultCount}
                </span>{" "}
                of {totalCount} jobs
              </>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-ink">
                  {totalCount}
                </span>{" "}
                jobs
              </>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
