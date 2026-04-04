"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const operatingTruths = [
  "The observatory evaluates matured forecasts, not fresh unresolved forecasts.",
  "Each forecast issuance is treated as its own auditable contract.",
  "The 7-day horizon is the live default for beta, while the dashboard remains horizon-aware.",
  "The frontend reads FastAPI evaluation endpoints, not Supabase directly.",
] as const;

const lifecycleSteps = [
  "Daily forecast flow writes new issuances into predictions.",
  "Daily price ingestion updates raw_price_data.",
  "Evaluation waits until the target date matures against available market data.",
  "If the target date lands on a non-trading day, the next available market day is used and stored as resolved_actual_date.",
  "Matured rows are written into forecast_evaluations and then surfaced in the observatory.",
] as const;

const implementedPages = [
  {
    title: "Login",
    route: "/login",
    purpose: "Internal access control for the observatory.",
  },
  {
    title: "Overview",
    route: "/",
    purpose: "Portfolio-level summary of matured evaluation performance.",
  },
  {
    title: "Pair Review",
    route: "/pairs/[pair]",
    purpose: "Deep inspection of one pair across evaluation, issuance, sentiment, and audit data.",
  },
  {
    title: "Weekly Reports",
    route: "/reports/weekly",
    purpose: "Time-boxed operating review for weekly evaluation performance.",
  },
  {
    title: "Help",
    route: "/help",
    purpose: "Internal reference for how to read and interpret the product.",
  },
  {
    title: "Settings",
    route: "/settings",
    purpose: "Lightweight beta preferences and product defaults.",
  },
] as const;

const metrics = [
  {
    title: "Matured Count",
    definition:
      "The number of forecast issuances that have reached a resolvable outcome and have been evaluated against real market data.",
    whyMatters: [
      "It tells us how much evidence we have behind every other metric.",
      "A strong hit rate on 5 rows means less than a moderate hit rate on 200 rows.",
    ],
    interpretation:
      "Treat this as the sample size for real-world evaluation, not just a count of forecasts issued.",
    note: "Before judging quality, first check how much resolved evidence you are judging it on.",
  },
  {
    title: "Directional Hit Rate",
    definition:
      "How often the model correctly predicted the direction of movement from the issuance current rate to the realized rate.",
    whyMatters: [
      "For many business decisions, direction matters more than exact magnitude.",
      "A model that gets direction right consistently may still be operationally useful even if exact final levels are imperfect.",
    ],
    interpretation:
      "This is the quickest practical signal of whether the model has directional edge.",
    note: "Current beta UI heuristic: 55% and above is treated as healthy directional edge.",
  },
  {
    title: "MAE",
    definition:
      "Mean absolute error, or the average size of the miss without caring whether the forecast was above or below the actual.",
    whyMatters: [
      "It is the cleanest way to explain typical miss size.",
      "It keeps day-to-day forecast quality readable and easy to compare.",
    ],
    interpretation:
      "Use this to answer: if the model is wrong, how wrong is it on average?",
    note: "Current beta UI heuristic: values below 0.05 are treated as favorable quick-read signals.",
  },
  {
    title: "RMSE",
    definition:
      "Root mean squared error, which is similar to MAE but gives more weight to larger misses.",
    whyMatters: [
      "It helps expose instability and outlier errors.",
      "It prevents a few very bad misses from hiding behind a reasonable MAE average.",
    ],
    interpretation:
      "MAE tells you the typical miss. RMSE tells you whether some misses are much worse than the average.",
    note: "If RMSE is much higher than MAE, investigate outlier periods or unstable market conditions.",
  },
  {
    title: "Bias",
    definition:
      "Average signed error. Positive means the model tends to over-predict and negative means it tends to under-predict.",
    whyMatters: [
      "A model can have acceptable hit rate while still drifting systematically high or low.",
      "Bias is one of the fastest ways to spot calibration problems.",
    ],
    interpretation:
      "Use bias to check whether misses lean in one direction instead of balancing out fairly.",
    note: "Bias is especially important when hit rate looks acceptable but the price level still drifts.",
  },
  {
    title: "MAPE",
    definition:
      "Mean absolute percentage error, or error size relative to the realized value.",
    whyMatters: [
      "It is useful for comparing across pairs with different price levels.",
      "It turns raw error into a percentage-based view that is easier to compare at a glance.",
    ],
    interpretation:
      "Use MAPE when you want a normalized view of miss size instead of only raw rate differences.",
    note: "This normalizes the miss into percentage terms so cross-pair comparisons stay readable.",
  },
  {
    title: "Quant MAE",
    definition:
      "MAE for the quant-only baseline before the sentiment adjustment layer modifies the forecast.",
    whyMatters: [
      "It gives us the baseline the adjustment layer needs to beat.",
      "It stops sentiment from being judged only by story instead of realized performance.",
    ],
    interpretation:
      "Read this as the raw quant forecast's error level before sentiment touched the output.",
    note: "This is the direct baseline for adjusted-versus-quant comparison.",
  },
  {
    title: "Sentiment Lift",
    definition:
      "The observatory's comparison of sentiment-adjusted behavior versus the quant-only baseline, typically through win rate and adjusted-versus-quant MAE delta.",
    whyMatters: [
      "It tells us whether sentiment adds value instead of only adding movement.",
      "It prevents the adjustment layer from being treated as automatically beneficial.",
    ],
    interpretation:
      "If adjusted MAE beats quant MAE, sentiment helped. If not, the quant-only baseline would have been better.",
    note: "Negative adjusted-versus-quant MAE delta is good. Positive delta means quant-only won.",
  },
] as const;

const overviewSections = [
  {
    title: "Filters and defaults",
    bullets: [
      "The Overview page supports currency pair, horizon, and evaluation window filters.",
      "The default state is ALL pairs, 7-day horizon, and the last 60 days.",
      "This is the best page for starting broad before drilling into a pair.",
    ],
  },
  {
    title: "KPI cards",
    bullets: [
      "Matured Forecasts tells us how much resolved evidence exists in the current window.",
      "Directional Hit Rate tells us whether the model has practical directional edge.",
      "Mean Absolute Error tells us typical miss size, with RMSE shown as supporting context.",
      "Sentiment Improvement tells us how often the adjusted forecast beat the quant-only baseline.",
    ],
  },
  {
    title: "Rolling Performance",
    bullets: [
      "Error mode shows daily MAE and RMSE by resolved actual date.",
      "Hit Rate mode shows directional accuracy over time.",
      "This chart is best for spotting improvement, instability, or regime changes rather than judging one global average.",
    ],
  },
  {
    title: "Insight charts and tables",
    bullets: [
      "Evaluation Share by Pair shows where the evidence density is coming from.",
      "Directional Accuracy by Pair shows where the model is more dependable.",
      "Sentiment Lift by Pair shows where the adjustment layer is actually earning trust.",
      "The table tabs split the story into leaderboard, direction analysis, and sentiment impact.",
    ],
  },
] as const;

const pairReviewSections = [
  {
    title: "Top of page",
    bullets: [
      "Pair Review is where performance stops being abstract and becomes explainable for one pair.",
      "The page shows pair-specific KPIs for matured rows, hit rate, MAE, sentiment wins, and bias.",
      "It also remembers the last pair and horizon reviewed so repeat analysis is faster.",
    ],
  },
  {
    title: "Charts tab",
    bullets: [
      "Predicted vs Actual compares the adjusted forecast, the quant baseline, and the realized market rate.",
      "Error Distribution shows whether misses are centered, skewed high, or skewed low.",
      "This tab is best for explaining calibration and miss behavior visually.",
    ],
  },
  {
    title: "Forecast Path tab",
    bullets: [
      "Latest Forecast Path shows the day-by-day curve from the latest stored issuance with daily path data.",
      "Prediction vs Current Rate Across Issuances compares current, day-1, and final outputs across recent forecast dates.",
      "The issuances table shows the operational ledger of what the API actually produced.",
    ],
  },
  {
    title: "Sentiment and Audit tabs",
    bullets: [
      "Sentiment Overlay compares sentiment score, adjustment size, and realized absolute error.",
      "Sentiment Records exposes rationale, factors, and sanitized LLM audit traces for inspection.",
      "Audit Trail gives row-level proof of what was predicted, what happened, and whether sentiment beat quant.",
    ],
  },
] as const;

const reportSections = [
  {
    title: "Why the weekly page exists",
    bullets: [
      "Overview helps us explore; Weekly Reports helps us operate.",
      "The page resolves to the latest available week with matured data when no week is selected.",
      "It is built for recurring internal review, exporting, and clean reporting conversations.",
    ],
  },
  {
    title: "What to read first",
    bullets: [
      "Start with the report week range, the selected horizon, and whether the page is showing the latest week with data.",
      "Then read evaluations, hit rate, MAE, and RMSE as the fastest weekly signal set.",
      "Use bias, MAPE, quant MAE, and quant delta to judge calibration and whether sentiment helped that week.",
    ],
  },
  {
    title: "Pair Breakdown and export",
    bullets: [
      "The Pair Breakdown table prevents portfolio averages from hiding weak pair-specific behavior.",
      "Quant Delta is especially important because negative means the adjusted forecast beat quant-only.",
      "CSV export makes the report portable into internal reviews and follow-up workflows.",
    ],
  },
] as const;

const operationalSections = [
  {
    title: "Help page",
    bullets: [
      "This page exists so nobody has to guess what the pipeline or the metrics mean.",
      "It should be your fallback page when someone asks how evaluation rows are created or why a view is empty.",
    ],
  },
  {
    title: "Settings page",
    bullets: [
      "Settings is intentionally lightweight for beta.",
      "It reinforces the product defaults: 7-day live horizon, 60-day evaluation window, and weekly reporting flow.",
      "It also signals that the observatory is designed for repeated internal use, not one-off screenshots.",
    ],
  },
  {
    title: "Login page",
    bullets: [
      "Login makes it clear the observatory is internal-only.",
      "The current auth model is a shared secret plus signed HTTP-only session cookie, which is appropriate for this stage.",
      "It is a control surface, not a public investor dashboard.",
    ],
  },
  {
    title: "What is not live yet",
    bullets: [
      "Monthly Reports is a placeholder in the sidebar.",
      "Investor View is also intentionally disabled.",
      "That is deliberate product discipline rather than unfinished clutter.",
    ],
  },
] as const;

const demoQuestions = [
  {
    question: "Why do some forecasts show up in Forecast Path but not in evaluation views?",
    answer:
      "Because raw forecast issuances are stored immediately, but evaluation rows only appear after the target date matures and actual market data is available.",
  },
  {
    question: "Why is 7 days the default?",
    answer:
      "Because it is the most operationally useful beta horizon for frequent review while the product remains horizon-aware for longer windows.",
  },
  {
    question: "What does sentiment improvement really mean?",
    answer:
      "It means the sentiment-adjusted forecast was closer to the realized outcome than the quant-only baseline on that row or across that summary window.",
  },
  {
    question: "Why should we trust this dashboard?",
    answer:
      "Because it preserves forecast issuances, waits for market resolution, and evaluates them against stored realized market data rather than subjective interpretation.",
  },
] as const;

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SectionGrid({
  sections,
}: {
  sections: readonly { title: string; bullets: readonly string[] }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={section.bullets} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HelpPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Internal handbook</Badge>
                <Badge variant="secondary">Reference guide</Badge>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Observatory Help
                </h1>
                <p className="max-w-4xl text-sm text-muted-foreground">
                  A built-in reference for why the observatory exists, how the
                  evaluation pipeline works, what each page is for, and how to
                  read and interpret the dashboard consistently.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Why This Exists</CardTitle>
                <CardDescription>
                  The observatory is not just a place to look at predictions. It
                  is the accountability layer that tells us whether the system is
                  earning trust after the market resolves each forecast.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Noeud is building systems that help African SMEs protect
                    margin and make better decisions during FX volatility. That
                    means forecasting quality cannot stay abstract. We need a
                    reliable way to compare what was predicted with what
                    actually happened.
                  </p>
                  <p>
                    The observatory answers that need by treating each forecast
                    issuance as an auditable contract that is judged only after
                    the market gives us a real outcome.
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Core product framing</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We are not only building models. We are building decision
                    systems, and the observatory is the layer that tells us
                    whether those systems are earning operational trust in the
                    real world.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-4">
              {operatingTruths.map((truth, index) => (
                <Card key={truth}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Truth {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {truth}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Page Map</CardTitle>
                <CardDescription>
                  The observatory currently ships as a small set of internal
                  pages focused on evaluation, interpretation, and repeated team
                  use.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {implementedPages.map((page) => (
                  <div key={page.route} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{page.title}</p>
                      <Badge variant="outline">{page.route}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {page.purpose}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Tabs defaultValue="narrative" className="space-y-6">
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="narrative">Foundations</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pair-review">Pair Review</TabsTrigger>
                <TabsTrigger value="reports">Weekly Reports</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
              </TabsList>

              <TabsContent value="narrative" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Lifecycle</CardTitle>
                    <CardDescription>
                      Forecasts are issued daily, but evaluation rows only
                      appear after the target date matures against real market
                      data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      {lifecycleSteps.map((step, index) => (
                        <li key={step}>
                          <span className="font-medium text-foreground">
                            {index + 1}.
                          </span>{" "}
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>What Problem The Observatory Solves</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Without an observatory, teams can see predictions but still lack proof of whether those predictions were actually useful.",
                          "The product creates a historical audit trail of what was predicted, what happened, and how far off the system was.",
                          "It also gives us a way to compare the final adjusted forecast against the quant-only baseline rather than assuming sentiment helps by default.",
                          "This turns model development into operating discipline instead of leaving performance assessment vague or anecdotal.",
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>What Makes This Different From Forecast History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Forecast history can show new issuances immediately after the API creates them.",
                          "The observatory is different because it focuses on matured forecasts that have resolved against real market data.",
                          "That distinction is why some records can appear in Forecast Path before they appear in evaluation views.",
                          "The observatory should therefore be read as a judged-performance layer, not just a prediction viewer.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>How To Think About The Product</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        The observatory should be understood as an operating
                        discipline layer. It tells us where the system is
                        dependable, where it is fragile, and whether the
                        intelligence we are building is actually useful under
                        real market conditions.
                      </p>
                      <p>
                        It is a matured forecast evaluation surface built on
                        persisted evidence, not an ad hoc dashboard reading raw
                        tables directly.
                      </p>
                      <p>
                        The business context matters here: if Noeud is helping
                        African SMEs protect margin and navigate currency
                        volatility, then we need a system that can explain not
                        just outputs, but whether those outputs deserved trust.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Common Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {demoQuestions.map((item) => (
                        <div key={item.question}>
                          <p className="text-sm font-medium">{item.question}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {metrics.map((metric) => (
                    <Card key={metric.title}>
                      <CardHeader>
                        <CardTitle>{metric.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Definition:
                          </span>{" "}
                          {metric.definition}
                        </p>
                        <div>
                          <p className="text-sm font-medium">Why it matters</p>
                          <BulletList items={metric.whyMatters} />
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <span className="font-medium">How to interpret it:</span>{" "}
                          <span className="text-muted-foreground">
                            {metric.interpretation}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Notes:
                          </span>{" "}
                          {metric.note}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>Overview Page</CardTitle>
                      <Badge variant="outline">/</Badge>
                    </div>
                    <CardDescription>
                      The portfolio-level control tower for matured evaluation
                      performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      This is the best page to start with because it answers the
                      first operating questions: how much resolved evidence
                      exists, whether the model is directionally useful, how
                      large the misses are, and whether sentiment is helping.
                    </p>
                    <p>
                      Overview tells us whether the forecasting system is
                      earning operational trust across the portfolio.
                    </p>
                  </CardContent>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Overview Route And Purpose</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Route: <code>/</code>
                      </p>
                      <p>
                        Purpose: provide a fast operating summary of real-world
                        forecast performance across the selected evaluation
                        window.
                      </p>
                      <p>
                        It is the best starting page because it answers the
                        first big questions: how much evaluated evidence exists,
                        whether the model is directionally useful, how large the
                        misses are, whether sentiment is helping, and which
                        pairs look strongest or weakest.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>What This Page Is Really For</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "The Overview page is the control tower for matured evaluations.",
                          "It does not show every forecast ever issued. It shows forecasts that were issued earlier, reached their target date, had actual market data available, and were converted into evaluation rows.",
                          "That distinction matters because it makes the page credible: the market has already judged the forecasts you are looking at.",
                          "If a metric looks strong on this page, it is based on realized outcomes rather than hypothetical model confidence.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
                <SectionGrid sections={overviewSections} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>How To Read The Overview Table Tabs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Pair Leaderboard is the all-around scorecard balancing evidence volume, directional usefulness, and error quality.",
                          "Direction Analysis is better when you want to understand behavior rather than only rank, especially bias and signal count.",
                          "Sentiment Impact isolates the adjustment layer so you can compare adjusted MAE, quant MAE, delta, win rate, and average adjustment directly.",
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Important Interpretation Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "MAE and RMSE both trending down usually indicate improving quality.",
                          "RMSE much higher than MAE suggests the presence of outlier misses.",
                          "A sudden jump in both error metrics can indicate a regime shift or a weak period for the model.",
                          "High hit rate with persistent bias means direction may be useful while level calibration still needs attention.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pair-review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>Pair Review Page</CardTitle>
                      <Badge variant="outline">/pairs/[pair]</Badge>
                    </div>
                    <CardDescription>
                      The page for deep inspection, explanation, and row-level
                      accountability.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      If Overview tells us where to look, Pair Review tells us
                      why. It combines matured evaluation history, raw forecast
                      issuance history, sentiment history, and audit-level rows
                      in one place.
                    </p>
                    <p>
                      Pair Review is where model performance stops being
                      abstract and becomes explainable.
                    </p>
                  </CardContent>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pair Review Route And Purpose</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Route: <code>/pairs/[pair]</code>
                      </p>
                      <p>
                        Purpose: inspect one currency pair in depth across
                        evaluation outcomes, raw forecast issuances, sentiment
                        records, and audit-level rows.
                      </p>
                      <p>
                        If Overview tells us where to look, Pair Review tells us
                        why.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Header Controls And Top KPIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "The page lets the user switch currency pair and horizon directly from the header.",
                          "It currently exposes 7-day, 14-day, and 30-day horizons in the UI.",
                          "The top KPI cards summarize matured rows, hit rate, MAE, sentiment wins, and bias so the pair can be assessed quickly before drilling deeper.",
                          "The page also remembers the last pair and horizon opened, which improves repeat review for internal users.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
                <SectionGrid sections={pairReviewSections} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Important Interpretation Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "If the adjusted line sits closer to actual than the quant line in Predicted vs Actual, sentiment is likely helping.",
                          "If both adjusted and quant lines drift away from actual, the pair likely needs model attention.",
                          "If the error histogram is mostly positive, the model tends to over-predict. If mostly negative, it tends to under-predict.",
                          "If sentiment adjustment magnitude is large but realized error does not improve, sentiment is adding movement without adding value.",
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Why The Audit Trail Matters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Every forecast issuance remains individually reviewable after the market resolves it.",
                          "This is the row-level proof layer for debugging, validation, and trust-building.",
                          "If someone asks what happened on a specific forecast, the audit tab is where the exact answer should come from.",
                          "This is one of the strongest governance features in the product because it makes the system defensible under scrutiny.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>Weekly Reports Page</CardTitle>
                      <Badge variant="outline">/reports/weekly</Badge>
                    </div>
                    <CardDescription>
                      The recurring reporting surface for weekly evaluation
                      review and export.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      This page turns the broader observatory into a clean,
                      time-boxed operating review. It is the best surface for
                      structured weekly cadence rather than free-form
                      exploration.
                    </p>
                    <p>
                      Weekly Reports turns model evaluation into a repeatable
                      operating cadence.
                    </p>
                  </CardContent>
                </Card>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Reports Route And Purpose</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Route: <code>/reports/weekly</code>
                      </p>
                      <p>
                        Purpose: turn evaluation data into a clean operating
                        review for a specific week.
                      </p>
                      <p>
                        This page is designed for recurring internal review,
                        exporting, and concise discussion of the latest resolved
                        performance.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>What To Read First</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Start with the report week range, the horizon, and whether the page is showing the latest available week with data.",
                          "Then read evaluations, hit rate, MAE, and RMSE as the fastest weekly signal set.",
                          "After that, use bias, MAPE, quant MAE, and quant delta to judge calibration and sentiment contribution.",
                          "If the overall week looks fine, still check the Pair Breakdown table so portfolio averages do not hide weak pair-specific behavior.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
                <SectionGrid sections={reportSections} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quant Delta And Sentiment Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Quant Delta equals adjusted MAE minus quant-only MAE.",
                          "Negative delta means the adjusted forecast won.",
                          "Positive delta means the quant-only baseline would have been better.",
                          "This is one of the most important weekly governance numbers because it judges the value of the adjustment layer directly.",
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export And Operating Use</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "The page supports CSV export from the evaluation export endpoint.",
                          "That makes the report portable for offline review, internal summaries, and archival workflows.",
                          "The weekly page should be read as the operating cadence layer, not just another chart page.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="operations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Supporting Pages And Product Posture</CardTitle>
                    <CardDescription>
                      The surrounding pages matter because they explain how the
                      observatory is meant to be used, who it is for, and what
                      has intentionally been deferred.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <SectionGrid sections={operationalSections} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Help Page Purpose</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "The Help page exists so users do not have to guess how the dashboard is populated or what the metrics mean.",
                          "It should be the default internal reference page for developers, operators, and anyone granted access to the observatory.",
                          "It is especially useful when someone asks when a forecast becomes evaluable, why a page is empty, or how a metric should be interpreted.",
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Settings And Login In Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BulletList
                        items={[
                          "Settings intentionally stays lightweight because the product is still in beta and only the useful defaults are exposed.",
                          "Login makes the observatory's posture clear: this is an internal control surface rather than a public dashboard.",
                          "The current auth model is deliberately simple for internal use: shared secret, signed cookie, and route protection.",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>How To Read The Main Views Quickly</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Rolling Performance:</strong> use this to spot whether
                  the live error trend is tightening or widening over time.
                </p>
                <p>
                  <strong>Pair Leaderboard:</strong> use this when deciding
                  where the model is dependable enough for stronger internal
                  confidence.
                </p>
                <p>
                  <strong>Forecast Path:</strong> use this on the pair review
                  page to inspect daily issuance curves, not just matured
                  outcomes.
                </p>
                <p>
                  <strong>Sentiment:</strong> use this to see whether sentiment
                  is genuinely improving error versus the quant-only baseline.
                </p>
                <p>
                  <strong>Audit Trail:</strong> use this when you need row-level
                  proof of what was predicted, what actually happened, and how
                  far off it was.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
