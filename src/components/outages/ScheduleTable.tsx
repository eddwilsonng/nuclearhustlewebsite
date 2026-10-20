'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface ScheduleRow {
  key: string;
  href: string;
  unit: string;
  plant: string;
  state: string;
  operator: string;
  lastRefueling: string;
  cycle: string;
  window: string;
  windowKind: 'in_outage' | 'due' | 'forecast' | 'none';
  confidence: string;
  coasting: boolean;
  season: 'spring' | 'fall' | 'other';
  sortWindow: string;
  sortLast: string;
  sortCycle: number;
}

type SortKey = 'unit' | 'state' | 'operator' | 'last' | 'cycle' | 'window';

const SEASONS = [
  { value: 'all', label: 'All seasons' },
  { value: 'spring', label: 'Spring' },
  { value: 'fall', label: 'Fall' },
] as const;

/** Rows shown before "Show all". Every row is still server-rendered. */
const INITIAL_ROWS = 15;

const cellClass = 'px-4 py-3 align-top';
const stickyCell =
  'sticky left-0 z-10 min-w-40 border-r border-rule bg-canvas group-hover:bg-surface lg:static lg:border-r-0';

export function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  const searchId = useId();
  const stateId = useId();
  const operatorId = useId();
  const bodyId = useId();
  const [query, setQuery] = useState('');
  const [season, setSeason] = useState<(typeof SEASONS)[number]['value']>('all');
  const [state, setState] = useState('all');
  const [operator, setOperator] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('window');
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const states = useMemo(() => [...new Set(rows.map((row) => row.state))].sort(), [rows]);
  const operators = useMemo(() => [...new Set(rows.map((row) => row.operator))].sort(), [rows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (season !== 'all' && row.season !== season) return false;
      if (state !== 'all' && row.state !== state) return false;
      if (operator !== 'all' && row.operator !== operator) return false;
      if (needle && !`${row.plant} ${row.unit} ${row.operator} ${row.state}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
    const direction = sortAsc ? 1 : -1;
    return filtered.sort((a, b) => {
      const value = (left: string | number, right: string | number) =>
        left < right ? -1 : left > right ? 1 : 0;
      if (sortKey === 'unit') return value(a.plant, b.plant) * direction || value(a.unit, b.unit);
      if (sortKey === 'state') return value(a.state, b.state) * direction;
      if (sortKey === 'operator') return value(a.operator, b.operator) * direction;
      if (sortKey === 'last') return value(a.sortLast, b.sortLast) * direction;
      if (sortKey === 'cycle') return (a.sortCycle - b.sortCycle) * direction;
      return value(a.sortWindow, b.sortWindow) * direction;
    });
  }, [operator, query, rows, season, sortAsc, sortKey, state]);

  const filtering = query.trim() !== '' || season !== 'all' || state !== 'all' || operator !== 'all';
  const capped = !expanded && visible.length > INITIAL_ROWS;

  function toggleSort(next: SortKey) {
    if (sortKey === next) {
      setSortAsc((current) => !current);
      return;
    }
    setSortKey(next);
    setSortAsc(true);
  }

  function clearFilters() {
    setQuery('');
    setSeason('all');
    setState('all');
    setOperator('all');
  }

  const sortProps = (key: SortKey) => ({
    active: sortKey === key,
    asc: sortAsc,
    onClick: () => toggleSort(key),
  });

  return (
    <div>
      <div className="grid gap-4 border-y border-rule py-4 md:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <div className="space-y-1.5">
          <FieldLabel htmlFor={searchId}>Find a plant</FieldLabel>
          <Input
            id={searchId}
            type="search"
            value={query}
            placeholder="Plant, operator, or state"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <p id={`${searchId}-season`} className="font-sans text-sm font-medium text-ink">
            Season
          </p>
          <div role="group" aria-labelledby={`${searchId}-season`} className="flex border border-control bg-raised">
            {SEASONS.map((option, i) => {
              const pressed = season === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setSeason(option.value)}
                  className={cn(
                    'min-h-10.5 flex-1 px-3 font-sans text-sm whitespace-nowrap transition-colors duration-150 md:flex-none',
                    i > 0 && 'border-l border-control',
                    pressed ? 'bg-ink text-inverse-ink' : 'text-secondary hover:bg-surface hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={stateId}>State</FieldLabel>
          <Select id={stateId} value={state} onChange={(event) => setState(event.target.value)}>
            <option value="all">All states</option>
            {states.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={operatorId}>Operator</FieldLabel>
          <Select id={operatorId} value={operator} onChange={(event) => setOperator(event.target.value)}>
            <option value="all">All operators</option>
            {operators.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex min-h-12 items-center justify-between gap-4 py-2">
        <p role="status" aria-live="polite" className="font-sans text-sm text-secondary">
          <span className="font-semibold tabular-nums text-ink">{visible.length}</span> of {rows.length} units
          {filtering ? ' match' : ', soonest window first'}
        </p>
        {filtering && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 font-sans text-sm font-semibold text-ink underline underline-offset-4 hover:no-underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="border border-rule px-6 py-10 text-center">
          <p className="font-sans text-base font-semibold text-ink">No units match these filters.</p>
          <p className="mt-1 font-sans text-sm text-secondary">Try a different season or state, or clear the filters.</p>
          <Button type="button" onClick={clearFilters} className="mt-4">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="relative overflow-x-auto border border-rule">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <caption className="sr-only">Refueling forecast for every operating US reactor</caption>
            <thead>
              <tr className="border-b border-rule bg-surface">
                <SortHeader label="Unit" sticky {...sortProps('unit')} />
                <SortHeader label="Next window" {...sortProps('window')} />
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-secondary">
                  Confidence
                </th>
                <SortHeader label="State" {...sortProps('state')} />
                <SortHeader label="Operator" {...sortProps('operator')} />
                <SortHeader label="Last refueling" {...sortProps('last')} />
                <SortHeader label="Cycle" {...sortProps('cycle')} />
              </tr>
            </thead>
            <tbody id={bodyId}>
              {visible.map((row, i) => (
                <tr
                  key={row.key}
                  className={cn('group border-b border-rule last:border-b-0 hover:bg-surface', capped && i >= INITIAL_ROWS && 'hidden')}
                >
                  <th scope="row" className={cn(cellClass, stickyCell, 'font-normal')}>
                    <Link href={row.href} className="font-sans text-sm font-semibold text-ink hover:underline">
                      {row.plant}
                    </Link>
                    {row.unit !== row.plant && <p className="font-mono text-xs text-secondary">{row.unit}</p>}
                  </th>
                  <td className={cn(cellClass, 'font-sans text-sm text-ink')}>
                    {row.windowKind === 'in_outage' ? (
                      <Badge tone="danger">{row.window}</Badge>
                    ) : row.windowKind === 'due' ? (
                      <span className="font-semibold">{row.window}</span>
                    ) : (
                      row.window
                    )}
                  </td>
                  <td className={cellClass}>
                    {row.coasting ? (
                      <Badge tone="featured">{row.confidence}</Badge>
                    ) : (
                      <span className="font-sans text-sm text-secondary">{row.confidence}</span>
                    )}
                  </td>
                  <td className={cn(cellClass, 'font-sans text-sm text-secondary')}>{row.state}</td>
                  <td className={cn(cellClass, 'font-sans text-sm text-secondary')}>{row.operator}</td>
                  <td className={cn(cellClass, 'font-mono text-xs whitespace-nowrap text-ink')}>{row.lastRefueling}</td>
                  <td className={cn(cellClass, 'font-mono text-xs whitespace-nowrap text-ink')}>{row.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {capped && (
        <div className="mt-4 flex justify-center">
          <Button type="button" aria-controls={bodyId} aria-expanded={false} onClick={() => setExpanded(true)}>
            Show all {visible.length} units
          </Button>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  asc,
  sticky,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  sticky?: boolean;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-3', sticky && 'sticky left-0 z-10 border-r border-rule bg-surface lg:static lg:border-r-0')}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex min-h-6 items-center gap-1.5 font-mono text-xs uppercase tracking-widest whitespace-nowrap hover:text-ink',
          active ? 'text-ink' : 'text-secondary',
        )}
      >
        {label}
        <span aria-hidden="true" className={active ? 'text-ink' : 'text-muted'}>
          {active ? (asc ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}
