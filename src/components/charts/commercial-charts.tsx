"use client";

import * as React from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_TICK,
  ChartFrame,
  GRID_PROPS,
  TooltipRow,
  TooltipShell,
  type LegendEntry,
} from "@/components/charts/frame";
import { hollowMarker, MarkerSwatch } from "@/components/charts/markers";
import { weekendBands } from "@/components/charts/weekend";
import { PAIR_COLOR_VAR } from "@/components/obs/badges";
import { InlineSelect } from "@/components/obs/inline-select";
import { niceDomain } from "@/lib/analytics";
import {
  bankColor,
  bankLabel,
  bankShape,
  buildBankSeries,
  MEAN_COLOR,
  pctDiff,
  QUOTE_TYPE_LABELS,
  type BankMargin,
  type QuoteLike,
} from "@/lib/commercial";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAIRS, type Pair } from "@/lib/types";

/** Few points means lines have nothing to join — draw markers so a lone day still shows. */
function dotFor(color: string, sparse: boolean, radius = 3.5) {
  return sparse ? { r: radius, strokeWidth: 0, fill: color } : false;
}

function Chip({
  active,
  color,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  color?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[0.7rem] font-medium transition-colors",
        active
          ? "border-transparent bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon ? (
        <span style={{ opacity: active ? 1 : 0.35 }} className="inline-flex">
          {icon}
        </span>
      ) : color ? (
        <span
          aria-hidden
          className="inline-block size-2 rounded-[2px]"
          style={{ background: color, opacity: active ? 1 : 0.35 }}
        />
      ) : null}
      {children}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2 py-1 text-[0.7rem] font-medium transition-colors",
            option.value === value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type ViewMode = "average" | "banks" | "both";

/**
 * Bank rates over time for one pair: the cross-bank mean with its min–max
 * range, each bank on its own line, and the provider series and model medians
 * the forecasts are actually built on — all toggleable, all on one rate axis.
 */
export function BankRatesChart({
  pair,
  quotes,
  banks,
  quoteTypes,
  provider,
  models,
  height = 380,
}: {
  pair: Pair;
  quotes: QuoteLike[];
  banks: string[];
  quoteTypes: string[];
  provider: { date: string; rate: number }[];
  models: { date: string; chronos: number | null; bootstrap: number | null }[];
  height?: number;
}) {
  const [quoteType, setQuoteType] = React.useState(
    quoteTypes.includes("transfer_selling") ? "transfer_selling" : (quoteTypes[0] ?? ""),
  );
  const [mode, setMode] = React.useState<ViewMode>("both");
  const [enabledBanks, setEnabledBanks] = React.useState<string[]>(banks);
  const [showProvider, setShowProvider] = React.useState(true);
  const [showChronos, setShowChronos] = React.useState(true);
  const [showBootstrap, setShowBootstrap] = React.useState(false);

  const rows = React.useMemo(() => {
    const providerMap = new Map(provider.map((item) => [item.date, item.rate]));
    const modelMap = new Map(
      models.map((item) => [item.date, { chronos: item.chronos, bootstrap: item.bootstrap }]),
    );
    return buildBankSeries(quotes, pair, quoteType, providerMap, modelMap);
  }, [quotes, pair, quoteType, provider, models]);

  const sparse = rows.length <= 20;
  const showAverage = mode !== "banks";
  const showBanks = mode !== "average";
  // A bank that never published the chosen label has nothing to plot; keep it
  // out of the legend and chips rather than implying a series exists.
  const banksWithData = React.useMemo(
    () => banks.filter((bank) => rows.some((row) => typeof row[bank] === "number")),
    [banks, rows],
  );
  const visibleBanks = React.useMemo(
    () => banksWithData.filter((bank) => enabledBanks.includes(bank)),
    [banksWithData, enabledBanks],
  );

  const axis = React.useMemo(() => {
    const values: number[] = [];
    for (const row of rows) {
      if (showAverage && row.mean !== null) values.push(row.mean);
      if (showAverage && row.range) values.push(...row.range);
      if (showProvider && row.provider !== null) values.push(row.provider);
      if (showChronos && row.chronos !== null) values.push(row.chronos);
      if (showBootstrap && row.bootstrap !== null) values.push(row.bootstrap);
      if (showBanks) {
        for (const bank of visibleBanks) {
          const value = row[bank];
          if (typeof value === "number") values.push(value);
        }
      }
    }
    return niceDomain(values, 6, 0.25);
  }, [rows, showAverage, showBanks, showProvider, showChronos, showBootstrap, visibleBanks]);

  const legend: LegendEntry[] = [
    ...(showAverage
      ? ([
          { label: "Bank mean", color: MEAN_COLOR, shape: "line" },
          { label: "Bank min–max", color: MEAN_COLOR, shape: "area" },
        ] as LegendEntry[])
      : []),
    ...(showBanks
      ? visibleBanks.map((bank) => ({
          label: bankLabel(bank),
          color: bankColor(bank),
          marker: bankShape(bank),
        }))
      : []),
    ...(showProvider
      ? ([{ label: "Provider rate (model input)", color: "var(--foreground)", shape: "line" }] as LegendEntry[])
      : []),
    ...(showChronos
      ? ([{ label: "Chronos median", color: "var(--chart-8)", shape: "dash" }] as LegendEntry[])
      : []),
    ...(showBootstrap
      ? ([{ label: "Bootstrap median", color: "var(--chart-7)", shape: "dash" }] as LegendEntry[])
      : []),
  ];

  const toggleBank = (bank: string) =>
    setEnabledBanks((current) =>
      current.includes(bank) ? current.filter((item) => item !== bank) : [...current, bank],
    );

  return (
    <ChartFrame
      title={`${pair} — bank rates over time`}
      description="Published Ghana bank rate cards for the selected quote label. The provider rate is what every model is trained and scored on; the bank series is a separate, commercial measurement of the same currency."
      legend={legend}
      height={height}
      toolbar={
        <InlineSelect
          ariaLabel="Quote label"
          value={quoteType}
          onChange={setQuoteType}
          options={quoteTypes.map((type) => ({
            value: type,
            label: QUOTE_TYPE_LABELS[type] ?? type,
            hint: type === "transfer_selling" ? "benchmark" : undefined,
          }))}
          className="border bg-card"
          contentClassName="min-w-[13rem]"
        />
      }
      controls={
        <>
          <Segmented
            label="Series"
            value={mode}
            onChange={setMode}
            options={[
              { value: "average", label: "Average" },
              { value: "banks", label: "Per bank" },
              { value: "both", label: "Both" },
            ]}
          />
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {banksWithData.map((bank) => (
            <Chip
              key={bank}
              active={enabledBanks.includes(bank)}
              icon={<MarkerSwatch shape={bankShape(bank)} color={bankColor(bank)} />}
              onClick={() => toggleBank(bank)}
            >
              {bankLabel(bank)}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <Chip active={showProvider} color="var(--foreground)" onClick={() => setShowProvider((v) => !v)}>
            Provider
          </Chip>
          <Chip active={showChronos} color="var(--chart-8)" onClick={() => setShowChronos((v) => !v)}>
            Chronos
          </Chip>
          <Chip active={showBootstrap} color="var(--chart-7)" onClick={() => setShowBootstrap((v) => !v)}>
            Bootstrap
          </Chip>
        </>
      }
      footnote={`${rows.length} publication date${rows.length === 1 ? "" : "s"} archived. Banks publish on business days only, so weekends are gaps — never a carried-forward Friday quote. The mean uses only the banks that actually published that day; it is a cross-bank benchmark only when at least two did.`}
    >
      <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={40}
          tickFormatter={formatShortDate}
          padding={sparse ? { left: 40, right: 40 } : undefined}
        />
        <YAxis
          domain={axis?.domain ?? ["auto", "auto"]}
          ticks={axis?.ticks}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={60}
          tickFormatter={(value: number) => value.toFixed(3)}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as ReturnType<typeof buildBankSeries>[number];
            return (
              <TooltipShell
                title={formatDate(row.date)}
                subtitle={`${QUOTE_TYPE_LABELS[quoteType] ?? quoteType} · ${row.bankCount} bank${row.bankCount === 1 ? "" : "s"}`}
              >
                {banks.map((bank) =>
                  typeof row[bank] === "number" ? (
                    <TooltipRow
                      key={bank}
                      label={bankLabel(bank)}
                      value={formatRate(row[bank] as number)}
                      color={bankColor(bank)}
                    />
                  ) : null,
                )}
                <TooltipRow label="Bank mean" value={formatRate(row.mean)} color={MEAN_COLOR} emphasis />
                <TooltipRow label="Bank median" value={formatRate(row.median)} />
                {row.provider !== null ? (
                  <>
                    <TooltipRow label="Provider" value={formatRate(row.provider)} color="var(--foreground)" />
                    <TooltipRow
                      label="Mean vs provider"
                      value={formatPercent(pctDiff(row.mean, row.provider), 2, true)}
                    />
                  </>
                ) : null}
                {row.chronos !== null ? (
                  <TooltipRow label="Chronos median" value={formatRate(row.chronos)} color="var(--chart-8)" />
                ) : null}
                {row.bootstrap !== null ? (
                  <TooltipRow label="Bootstrap median" value={formatRate(row.bootstrap)} color="var(--chart-7)" />
                ) : null}
              </TooltipShell>
            );
          }}
        />

        {showAverage ? (
          <Area
            dataKey="range"
            activeDot={false}
            stroke="none"
            fill={MEAN_COLOR}
            fillOpacity={0.12}
            isAnimationActive={false}
            connectNulls
          />
        ) : null}

        {showBanks
          ? visibleBanks.map((bank) => (
              <Line
                key={bank}
                dataKey={bank}
                stroke={bankColor(bank)}
                strokeWidth={1.5}
                dot={hollowMarker(bankShape(bank), bankColor(bank), 5.5, 2)}
                activeDot={hollowMarker(bankShape(bank), bankColor(bank), 7, 2.5)}
                connectNulls
                isAnimationActive={false}
              />
            ))
          : null}

        {showAverage ? (
          <Line
            dataKey="mean"
            stroke={MEAN_COLOR}
            strokeWidth={2.5}
            dot={{ r: sparse ? 4 : 2.5, strokeWidth: 2, stroke: "var(--card)", fill: MEAN_COLOR }}
            connectNulls
            isAnimationActive={false}
          />
        ) : null}

        {/* Reference series last, so a bank quote can never hide the model or provider. */}
        {showProvider ? (
          <Line
            dataKey="provider"
            stroke="var(--foreground)"
            strokeWidth={2}
            dot={dotFor("var(--foreground)", sparse)}
            connectNulls
            isAnimationActive={false}
          />
        ) : null}
        {showChronos ? (
          <Line
            dataKey="chronos"
            stroke="var(--chart-8)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={dotFor("var(--chart-8)", sparse, 3)}
            connectNulls
            isAnimationActive={false}
          />
        ) : null}
        {showBootstrap ? (
          <Line
            dataKey="bootstrap"
            stroke="var(--chart-7)"
            strokeWidth={2}
            strokeDasharray="2 3"
            dot={dotFor("var(--chart-7)", sparse, 3)}
            connectNulls
            isAnimationActive={false}
          />
        ) : null}
      </ComposedChart>
    </ChartFrame>
  );
}

export type SpreadRow = { date: string } & Partial<Record<Pair, number>> &
  Partial<Record<`${Pair}_n`, number>>;

/**
 * The commercial spread — bank mean minus the provider rate, in percent — for
 * all three pairs on one axis. This is the gap between what the model predicts
 * and what a bank card shows, and it exists even when the model is exact.
 */
export function SpreadChart({ rows, height = 260 }: { rows: SpreadRow[]; height?: number }) {
  const sparse = rows.length <= 20;
  return (
    <ChartFrame
      title="Commercial spread over the provider rate"
      description="Cross-bank mean transfer-selling rate minus the ExchangeRate-API rate for the same date, as a percentage of the provider rate."
      legend={PAIRS.map((pair) => ({ label: pair, color: PAIR_COLOR_VAR[pair], shape: "line" as const }))}
      height={height}
      footnote="A stable positive spread is the banks' markup over the reference series — expected, and not a forecasting error. What is worth watching is the spread moving: widening often precedes or accompanies cedi stress."
    >
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={40}
          tickFormatter={formatShortDate}
          padding={sparse ? { left: 40, right: 40 } : undefined}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
          domain={[
            (min: number) => Math.min(0, Math.floor(min * 10) / 10),
            (max: number) => Math.ceil(max * 10) / 10 + 0.1,
          ]}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as SpreadRow;
            return (
              <TooltipShell title={formatDate(row.date)}>
                {PAIRS.map((pair) =>
                  row[pair] === undefined ? null : (
                    <TooltipRow
                      key={pair}
                      label={`${pair} (${row[`${pair}_n`] ?? "—"} banks)`}
                      value={formatPercent(row[pair] as number, 3, true)}
                      color={PAIR_COLOR_VAR[pair]}
                    />
                  ),
                )}
              </TooltipShell>
            );
          }}
        />
        {PAIRS.map((pair) => (
          <Line
            key={pair}
            dataKey={pair}
            stroke={PAIR_COLOR_VAR[pair]}
            strokeWidth={2}
            dot={{ r: sparse ? 4 : 2, strokeWidth: 0, fill: PAIR_COLOR_VAR[pair] }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}

/**
 * Each bank's own buy/sell margin on the latest publication date, grouped by
 * pair. This is the cost of converting through that bank, independent of any
 * forecast — and the reason a bank mid is not the bank's selling rate.
 */
export function BankMarginChart({
  margins,
  banks,
  height = 260,
}: {
  margins: { transfer: BankMargin[]; cash: BankMargin[] };
  banks: string[];
  height?: number;
}) {
  const [channel, setChannel] = React.useState<"transfer" | "cash">("transfer");
  const data = React.useMemo(() => {
    const scoped = margins[channel].filter((item) => item.marginPct !== null);
    const latestDate = scoped.reduce<string>(
      (latest, item) => (item.observed_on > latest ? item.observed_on : latest),
      "",
    );
    return PAIRS.map((pair) => {
      const row: Record<string, string | number> = { pair };
      for (const item of scoped) {
        if (item.pair === pair && item.observed_on === latestDate) {
          row[item.bank] = item.marginPct as number;
        }
      }
      return row;
    });
  }, [margins, channel]);

  return (
    <ChartFrame
      title="Bank buy/sell margin"
      description="Selling minus buying, as a percentage of the bank's own mid, on the latest publication date."
      legend={banks.map((bank) => ({ label: bankLabel(bank), color: bankColor(bank), shape: "area" as const }))}
      height={height}
      toolbar={
        <Segmented
          label="Channel"
          value={channel}
          onChange={setChannel}
          options={[
            { value: "transfer", label: "Transfer" },
            { value: "cash", label: "Cash" },
          ]}
        />
      }
      footnote="A bank with no bar did not publish both sides of that channel for the pair. FNB publishes no cash-selling rate, so it has no cash margin."
    >
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        barGap={4}
        key={channel}
      >
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="pair" tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fontFamily: "var(--font-mono)" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={46}
          tickFormatter={(value: number) => `${value.toFixed(1)}%`}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as Record<string, string | number>;
            return (
              <TooltipShell title={String(row.pair)} subtitle={`${channel === "transfer" ? "Transfer" : "Cash"} margin`}>
                {banks.map((bank) =>
                  typeof row[bank] === "number" ? (
                    <TooltipRow
                      key={bank}
                      label={bankLabel(bank)}
                      value={formatPercent(row[bank] as number, 2)}
                      color={bankColor(bank)}
                    />
                  ) : null,
                )}
              </TooltipShell>
            );
          }}
        />
        {banks.map((bank) => (
          <Bar
            key={bank}
            dataKey={bank}
            fill={bankColor(bank)}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

/**
 * Small multiple for the overview: one pair's bank mean (with its min–max
 * range) against the provider rate over recent weeks. Each pair gets its own
 * axis because the three sit at very different levels.
 */
export function BankVsProviderSpark({
  pair,
  provider,
  bank,
  height = 150,
}: {
  pair: Pair;
  provider: { date: string; rate: number }[];
  bank: { date: string; mean: number; min: number; max: number; bankCount: number }[];
  height?: number;
}) {
  const rows = React.useMemo(() => {
    const byDate = new Map(bank.map((row) => [row.date, row]));
    const start = bank[0]?.date ?? provider.at(-1)?.date ?? "";
    // Show the provider line for a fortnight before the first bank quote so the
    // spread has context, then everything after it.
    const from = new Date(`${start}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 14);
    const fromIso = from.toISOString().slice(0, 10);
    return provider
      .filter((point) => point.date >= fromIso)
      .map((point) => {
        const quote = byDate.get(point.date);
        return {
          date: point.date,
          provider: point.rate,
          mean: quote?.mean ?? null,
          range: quote ? ([quote.min, quote.max] as [number, number]) : null,
          bankCount: quote?.bankCount ?? null,
        };
      });
  }, [provider, bank]);

  const axis = React.useMemo(() => {
    const values: number[] = [];
    for (const row of rows) {
      values.push(row.provider);
      if (row.range) values.push(...row.range);
    }
    return niceDomain(values, 4, 0.2);
  }, [rows]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="date"
            scale="band"
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            minTickGap={32}
            tickFormatter={formatShortDate}
          />
          <YAxis
            domain={axis?.domain ?? ["auto", "auto"]}
            ticks={axis?.ticks}
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            width={46}
            tickFormatter={(value: number) => value.toFixed(2)}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof rows)[number];
              return (
                <TooltipShell title={formatDate(row.date)} subtitle={pair}>
                  <TooltipRow label="Provider" value={formatRate(row.provider)} color="var(--foreground)" />
                  {row.mean !== null ? (
                    <>
                      <TooltipRow
                        label={`Bank mean (${row.bankCount})`}
                        value={formatRate(row.mean)}
                        color={MEAN_COLOR}
                        emphasis
                      />
                      <TooltipRow
                        label="Spread"
                        value={formatPercent(pctDiff(row.mean, row.provider), 2, true)}
                      />
                    </>
                  ) : (
                    <TooltipRow label="Bank mean" value="no publication" />
                  )}
                </TooltipShell>
              );
            }}
          />
          {weekendBands(rows.map((row) => row.date))}
          <Area
            dataKey="range"
            activeDot={false}
            stroke="none"
            fill={MEAN_COLOR}
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Line
            dataKey="provider"
            stroke="var(--foreground)"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="mean"
            stroke={MEAN_COLOR}
            strokeWidth={2}
            dot={{ r: 3.5, strokeWidth: 2, stroke: "var(--card)", fill: MEAN_COLOR }}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
