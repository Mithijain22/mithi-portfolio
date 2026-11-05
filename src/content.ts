// All personal content lives here. Nothing personal may be hard-coded anywhere else.
// Section bodies: blank line = new paragraph; lines starting with "- " = bullet list; **bold** is supported.

export interface CaseStudySection { heading: string; body: string; image?: string }
export interface Stat { value: string; label: string }
export interface Project {
  index: string;
  slug: string;
  title: string;
  annotation: string;
  outcome: string;
  role: string;
  timeline: string; // leave '' to hide it
  tools: string;
  problem: string;
  approach: string;
  result: string;
  heroImage: string;          // card + case study picture; '' = use cardStat (or halftone dots)
  cardStat?: Stat;            // big number shown on the card when there is no picture
  summary: string;            // short text on the work card
  stats: Stat[];              // three big numbers on the case study page
  links: { label: string; url: string }[]; // buttons on the case study page
  repo: string;               // if set, the work card links here instead of the case study page
  caseStudy: { sections: CaseStudySection[] };
}

export const NAME = 'MITHI';
export const TAGLINE = 'Ideas merge, products ship.';
export const PORTRAIT = '';
export const SITE_URL = ''; // set when a real domain exists

export const PROJECTS: Project[] = [
  {
    index: '00_1',
    slug: 'truck-art-daily',
    title: 'TRUCK ART DAILY',
    annotation: 'a word game with a clue',
    outcome: `A live daily word puzzle with server-side scoring, over 160 automated tests, and artwork cut from 15 MB to under 1 MB.`,
    role: 'Creator and product owner',
    timeline: '',
    tools: 'React, TypeScript, Supabase, Vercel, Vitest, Playwright',
    problem: `Sometimes a Wordle answer is a word you have never heard of, and letter-guessing stops being fair.`,
    approach: `Every daily puzzle comes with a trivia clue, so what you already know can lead you to the word. The server keeps the answer and scores every guess.`,
    result: `Live and played daily. Early players found the clue sometimes distracting, which is shaping what I test next.`,
    heroImage: '/img/truck-art-daily.jpg',
    summary: `A daily word puzzle with a trivia clue, built for the words you have never heard of. React, TypeScript and Supabase, with the answers kept on the server.`,
    stats: [
      { value: '160+', label: 'automated tests' },
      { value: '15 MB → <1 MB', label: 'artwork weight, same look' },
      { value: '51,000', label: 'words accepted as guesses' },
    ],
    links: [{ label: 'PLAY IT', url: 'https://truck-art-daily.vercel.app' }],
    repo: '',
    caseStudy: { sections: [
      { heading: 'THE IDEA', body: `Sometimes a Wordle answer is a word you have simply never come across. No amount of letter-guessing feels fair then, and the game turns from fun to frustrating.

So every puzzle here comes with a **clue** drawn from trivia, so that what you already know can help you reach the word. To keep the clues interesting they come in many styles: famous fill-in-the-blank lines, song and film quotes, mythology, science and animal-group facts, sports moments and more.

It sits between a word game and a trivia quiz. Early players told me the clue was sometimes distracting and could simply be googled, and that turned out to be the most useful design feedback of the project.` },
      { heading: 'HOW IT PLAYS', body: `- **One puzzle a day**, the same for everyone, switching at midnight India time.
- **Six guesses** at a 4 to 7 letter word. Tiles show a correct letter in the right place, the right letter in the wrong place, or not in the word. Each state also has a shape marker, so colour is never the only signal.
- **Real words only.** A made-up word shakes the row and does not use a turn. The list has about 51,000 words, including British spellings and everyday Indian terms.
- **No account.** The browser gets an anonymous identity and the player picks a nickname. No email, no password.
- **One attempt per day.** A finished puzzle is locked. Refreshing, reopening or changing the phone's clock does not allow a replay.
- **A result screen** with an illustrated mascot, the answer, a streak shown as a truck on a road, a countdown to the next puzzle, and a Share button whose text never reveals the answer.
- It can be installed on a phone's home screen, and it respects the reduce-motion setting.` },
      { heading: 'HOW IT WORKS', body: `- **The server owns the truth.** The browser sends a guess, a function scores it, saves it and returns the tile colours. The answer is only included once that player's game is finished.
- **A locked-down database.** Every table has row-level security on, and the public key has no access to puzzle data at all.
- **The database decides the date.** "Today" is computed in Postgres in India time, so the phone's clock is never trusted. The next-puzzle countdown starts from the server's time-to-reset and runs on the browser's own stopwatch.
- **One attempt per player per day, even under pressure.** A unique constraint and a transactional function stop races, and recording a guess is safe to retry, so a double-tap records once.
- **Rate limits sized for India.** 30 requests a minute per user, but a looser 300 a minute per IP address, because many mobile users share one carrier address.
- **Privacy by design.** Anonymous IDs, no ads and no third-party trackers. Only ten whitelisted events are logged, each with at most one number.
- **Security headers,** including a strict Content-Security-Policy and HSTS.` },
      { heading: 'DESIGN', body: `The look is a decorated-truck style: bright borders, tassels that sway, a mascot who reacts to your result, and a small truck that moves along the road as you use guesses and for your streak.

I built the screens from three approved reference pages and compared screenshots side by side at three phone sizes. The landing page showed no measurable difference from its reference, and the result screens differed by about 0.3% of pixels.` },
      { heading: 'HOW I KNOW IT WORKS', body: `- **Over 160 automated tests:** 146 that run anywhere (scoring rules, word list, nickname rules, share text, and the database itself, including its security rules and the date rollover at 23:59:59 versus 00:00:00 India time), plus 16 live security tests that attack the real database using only the public key.
- **Browser tests:** a smoke test of the main journey and 31 scripted play-through checks.
- **Live verification scripts** play real games against the deployed site. They prove that no answer appears in any response before a game ends, that a seventh guess is refused, and that bursts of requests get rate-limited.
- **A leak scanner** searches the built site for the secret key and for any puzzle text.
- **Performance:** the supplied artwork came to 15.3 MB. I re-saved it as right-sized WebP at three times the displayed size and compared at 3× zoom with no visible difference. The artwork is now under 1 MB, and the landing page loads about 1.5 MB before compression.` },
      { heading: 'PROBLEMS I HIT', body: `- **Players could type nonsense and lose a turn.** My first plan deliberately had no dictionary check. Once the puzzle set was all common words, that choice was wrong. Players reported it, and I added a server-side word check that refuses a made-up word before anything is saved, keeps the typed letters and does not use a turn.
- **A race condition waiting to happen.** Tapping Enter twice, or a flaky connection retrying, could have recorded one guess twice. I made recording a guess idempotent and verified it on the live database by firing two identical requests at the same instant.
- **Never trusting the phone.** The date, the countdown and the puzzle choice are all driven by the server, so changing the device clock gains nothing.
- **15 MB of artwork** on a phone game. See above.` },
      { heading: 'HOW IT WAS BUILT', body: `I came up with the idea and the clue concept, wrote the trivia puzzles, directed the look and made the product decisions. The code was written and tested with an AI coding assistant (Claude), working from a written specification split into phases, each with acceptance checks and a short report before moving on.` },
      { heading: 'WHAT I LEARNED', body: `- **A checklist run before launch finds real problems:** the missing word check and the artwork size both came out of it.
- **Move the rules to the server early.** Everything fair about a daily game, such as one attempt, the right day and hidden answers, depends on it.
- **Plans written before players show up are guesses.** The word-check decision looked sensible on paper and was wrong in practice.
- **Measure, don't assume.** The 15 MB of art, two near-identical-looking screens and a clock that can't be trusted all showed up in numbers first.` },
      { heading: 'WHAT IS NEXT', body: `- Give the game its own name and domain.
- Try theme days and a calmer clue presentation, based on what players say.
- A full accessibility audit, CAPTCHA against fake sign-ups, and a further speed pass.` },
    ] },
  },
  {
    index: '00_2',
    slug: 'causa',
    title: 'CAUSA',
    annotation: 'why only one star?',
    outcome: `Late delivery accounts for 38.2% of coded 1-star complaints, and the causal test I committed to in advance failed, so I reported it as suggestive.`,
    role: 'Analysis and dashboard design',
    timeline: '',
    tools: 'Tableau Public, difference-in-differences, text classification',
    problem: `Why do 1-star reviews on Olist cluster around certain sellers and regions: logistics, product quality, seller service, or a mix?`,
    approach: `I stated three hypotheses before any modelling, tried a causal difference-in-differences design with pre-committed robustness checks, and classified the review text by complaint type.`,
    result: `Late delivery is the dominant correlate, but the causal test failed 2 of 3 checks and is reported as suggestive.`,
    heroImage: '',
    cardStat: { value: '5% → 55%', label: '1-star rate: fast vs slow delivery' },
    summary: `Root-cause analysis of 1-star reviews on a Brazilian e-commerce marketplace. A causal test that failed its own pre-committed checks, reported honestly.`,
    stats: [
      { value: '38.2%', label: 'of coded 1-star complaints are about late delivery' },
      { value: '5.0% → 55.2%', label: '1-star rate for 0–3 day vs 30+ day deliveries' },
      { value: '96,478', label: 'delivered orders analysed' },
    ],
    links: [],
    repo: '',
    caseStudy: { sections: [
      { heading: 'THE QUESTION', body: `Why do 1-star reviews cluster around certain sellers and regions on Olist, a Brazilian e-commerce marketplace? Is it a logistics problem, a product problem, a seller-service problem, or some mix? And can any of it be shown causally, not just as correlation?

The data is Olist's public dataset: 96,478 delivered orders from September 2016 to October 2018.` },
      { heading: 'THREE HYPOTHESES, STATED BEFORE ANY MODELLING', body: `- **H1, logistics:** delivery delay drives 1-star reviews.
- **H2, product quality:** damage, wrong items or misleading descriptions drive 1-star reviews.
- **H3, seller service:** seller responsiveness and handling drive 1-star reviews, independent of delivery time.` },
      { heading: 'THE HEADLINE FINDING', body: `Logistics is the dominant correlate of 1-star reviews. Late delivery alone accounts for **38.2% of coded 1-star complaints**, and the raw baseline is stark: a **5.0% 1-star rate for 0–3 day deliveries against 55.2% for 30+ day deliveries.**

Product-quality issues are a real but secondary driver, at about 20.9% of coded complaints.

Seller identity also matters on its own. Among sellers with 100+ orders, holding delivery speed roughly constant, 1-star rates still range from 0% to 52.6%.

The causal attempt did not hold up. It failed 2 of 3 pre-committed robustness checks and is explicitly downgraded from causal to suggestive. I treat that as a real finding, not a failure.` },
      { heading: 'METHOD', body: `- **Track A, causal:** difference-in-differences using a graded treatment intensity (a state's average delivery time before the window, as a proxy for distance from the São Paulo fulfilment hub), interacted with a November 2017 to March 2018 window. Checked with two placebo tests and two alternate specifications.
- **Track B, correlational:** keyword and phrase classification applied directly to the Portuguese text of 1-star reviews, manually validated against sampled reviews over two rounds.
- **Naive baseline:** descriptive cuts by delivery-time bucket, lateness against the estimate, region and seller, used as the "this alone isn't proof" comparison throughout.` },
      { heading: 'HOW THE RESULT WAS REACHED', body: `**Hunting for a causal discontinuity.** Two candidates were checked and rejected before a usable design. The May 2018 Brazilian trucker strike, a real documented logistics shock, showed up as only a brief one-week dip in volume, too muted to build on. A February to March 2018 spike looked regional at first, with São Paulo barely moving and Rio de Janeiro moving sharply. But extending the pre-period to 10 months and adding more comparison states showed that Minas Gerais swung almost as much, so Rio was never uniquely treated. I documented it as a dead end instead of quietly discarding it.

**The graded design, and its failure.** I switched to a continuous "peripherality" intensity variable with state and month fixed effects. The headline coefficient came back significant (p = 0.023). But a stop-loss rule written down before running anything required two checks. The placebo test, a fake window with no known shock, came back significant when it should have been null. Dropping São Paulo flipped the sign of the effect and killed its significance. Following the rule, I downgraded the estimate to suggestive instead of re-specifying until something passed.

**A method substitution, made explicit.** The plan was machine translation before topic modelling. Standing up that infrastructure was not a good use of time for this scope, so I built a Portuguese keyword lexicon and applied it to the original text. Round one of validation found a real gap in "wrong or incomplete item" phrasing, which I fixed and re-validated in round two. Final coverage: 56.1% of 1-star reviews with text matched at least one category.` },
      { heading: 'HONEST LIMITATIONS', body: `- **The causal claim for H1 is not established.** The estimate is suggestive at best. The likely reason it failed is a platform-wide improvement trend confounded with the seasonal window.
- **43.9% of 1-star reviews with text matched no category,** a mix of short, vague reviews and long-tail phrasing a keyword approach can't cover without overfitting.
- **Seller-unresponsive complaints are almost certainly undercounted** by text matching (explicit mentions are only 1.3%). The seller-level spread, from 0% to 52.6% within matched delivery-time buckets, is the more trustworthy signal for H3.
- **Geographic coverage is uneven.** Several states have too little volume for reliable estimates and were excluded below a 100-order threshold.` },
      { heading: 'PROPOSED EXPERIMENT', body: `An expedited-fulfilment SLA for the slowest delivery-time quartile of sellers: 52 of 207 high-volume sellers, 26.9% of high-volume order volume, with a 12.9% average 1-star rate against 9.8% for the full population.

I propose a seller-randomised A/B test with a power calculation for three possible minimum detectable effects. A prospective experiment is still warranted, because the historical estimate was downgraded.` },
      { heading: 'THE DASHBOARD', body: `Built in Tableau Public, with six linked exhibits:

- Delivery time against 1-star rate
- A timeline of delivery days and 1-star rate, with the November 2017 to March 2018 window visible in the shared peak
- Complaint categories
- 1-star rate by region
- A seller scatter of delivery speed against complaint rate, showing the wide vertical spread behind H3
- A sortable seller docket` },
      { heading: 'WHAT IS NEXT', body: `- Run the seller-randomised A/B test to get a real causal read on the delivery SLA.
- Use an event-study design across all 25 months to separate the platform-wide trend from any seasonal effect.
- Revisit the text classification with proper translation, to see whether topic modelling beats the 56.1% coverage of the keyword lexicon.` },
    ] },
  },
  {
    index: '00_3',
    slug: 'delphi',
    title: 'DELPHI',
    annotation: 'forecast the spread, not the average',
    outcome: `Deciding from a full predictive distribution instead of a point forecast saved $38,736.57 (7.81%) in simulated inventory cost on demand the models never saw.`,
    role: 'Forecasting and decision analysis',
    timeline: '',
    tools: 'Python, LightGBM, conformal prediction, Streamlit',
    problem: `Forecast error is a proxy metric. Nobody orders stock to minimise RMSE; they order to avoid stockouts and overstock.`,
    approach: `I built a point forecast, a full predictive distribution two ways, and a newsvendor ordering layer on top, then scored both decisions against held-out demand.`,
    result: `The distribution saved 7.81% in inventory cost, positive in every backtest window, department and store.`,
    heroImage: '',
    cardStat: { value: '$38.7K', label: 'saved vs a point forecast' },
    summary: `Does a full predictive distribution pay for itself in a real inventory decision? A newsvendor test on Walmart M5 demand, scored in dollars.`,
    stats: [
      { value: '$38.7K', label: 'saved (7.81%) vs a point forecast, 95% CI $35.9K to $41.8K' },
      { value: '6 of 6', label: 'backtest windows with a positive saving' },
      { value: '2,260', label: 'item-store series, scored on unseen demand' },
    ],
    links: [],
    repo: '',
    caseStudy: { sections: [
      { heading: 'THE QUESTION', body: `Most public solutions to the M5 forecasting competition optimise leaderboard rank. Delphi asks something more useful for a business: does a full predictive distribution actually pay for itself in a real inventory decision, and by how much?

Forecast accuracy (RMSE, WRMSSE) is a proxy. Nobody orders inventory to minimise RMSE. They order to avoid two costs: a stockout (lost sales, cost Cu per unit short) and overstock (holding or markdown cost Co per unit excess). The best order quantity under those costs is a quantile of the demand distribution, the newsvendor critical fractile Cu / (Cu + Co), not the mean. A point-forecast model can only ever target the mean, so it can only get the order right by coincidence.` },
      { heading: 'THE SCOPE', body: `The Walmart M5 data, limited to the HOBBIES_1 and HOBBIES_2 departments across four stores (CA_1, CA_2, TX_1, WI_1). That is 2,260 item-store series.

I chose both departments on purpose. HOBBIES_1 is higher volume and steadier, HOBBIES_2 is sparse and intermittent, so the failure analysis has something real to bite on. The subset spans California, Texas and Wisconsin, so state-level SNAP effects are exercised. I checked the covariates instead of assuming them: price changes occur in 66.6% of series, and named events cover 8.2% of days.

The compromise was compute. The full dataset has about 30,490 series, and this subset allowed full rolling-origin backtesting and a three-way method comparison. The pipeline needs no structural change to scale up.` },
      { heading: 'THE HEADLINE RESULT', body: `Using the full predictive distribution instead of a point forecast saved **$38,736.57 (7.81%)** in simulated inventory cost, with a 95% bootstrap confidence interval of [$35,884, $41,829]. It was scored across 6 rolling-origin backtest windows and 2,260 series, against realised demand the models never saw.

The saving is not a fluke of aggregation. It is positive in every window (5.7% to 11.0%), in both departments (7.7% and 8.4%) and in every store (6.5% to 8.9%).

That number is only trustworthy if the distribution is calibrated, so I checked calibration before computing the dollars, not after. Split conformal prediction hit its 90% coverage target almost exactly in every window and had the narrowest intervals of the three methods. Raw quantile LightGBM and conformalised quantile regression both over-covered at around 95 to 96%.` },
      { heading: 'HOW THE RESULT WAS REACHED', body: `- **Panel construction:** melt the wide sales table to long form, join the calendar (with each row's state-specific SNAP flag) and the weekly prices.
- **Baselines:** a seasonal-naive strawman (MAE 0.89) against a Poisson-objective LightGBM with lags, rolling statistics, SNAP, price-change signals and calendar events (MAE 0.76). I flagged this metric as a sanity check, not the finding.
- **Rolling-origin backtest:** 6 walk-forward windows, each with a 28-day held-out horizon. To avoid circularity, features are lag-shifted by a fixed 28 days, and the code asserts that training ends before testing begins. A separate 28-day calibration slice, never used to fit the model, is what the conformal adjustments are calibrated on.
- **Three ways to get a distribution:** quantile LightGBM at five levels, split conformal wrapped around the point forecast, and conformalised quantile regression.
- **The decision layer:** a newsvendor critical fractile of 0.75 (stockout cost $3, holding cost $1), so the order quantity is the model's 0.75 quantile. The point-forecast order and the distribution-based order are scored against the same real demand.
- **Failure analysis:** series bucketed by how often demand is zero, to see where things break.` },
      { heading: 'HONEST LIMITATIONS', body: `- **Pooled conformal coverage hides a real per-segment gap.** Split conformal covers only 54.1% of low-intermittency (high-volume) series against a 90% target, and over-covers the sparsest series at 97.7%. The cause is that its interval half-width is one global constant. Quantile LightGBM stays far steadier (93.7%, 95.0%, 96.6%) because it conditions on each series. The headline used the quantile model, so it does not change, but anyone using the conformal intervals per series should not trust them as they are.
- **Price-change days are a weak spot.** Only 0.09% of test rows coincide with a price change, but point-forecast error there is 3.3 times higher and the saving drops from 7.8% to 3.4%. Lag and rolling features can't see a price change until after it happens.
- **Pooled calibration plots mislead on intermittent demand.** At the lowest quantile the nominal 5% looks like 75.7% empirically, but that tracks 75.7% of test sales being exactly zero, not a broken model.
- **The costliest series are moderately, not extremely, intermittent,** so effort is better spent on higher-volume series with subtler calibration problems.
- **A compute constraint.** I built this on modest hardware, and one long-lived process exhausted memory, so each window runs in its own subprocess. It is documented in the code as an engineering constraint, not a modelling choice.` },
      { heading: 'WHAT IS NEXT', body: `- Scale to the full M5 dataset, around 30,000 series.
- Per-segment or per-series conformal calibration, motivated directly by the coverage gap above.
- A full distributional model (DeepAR or NGBoost) as a third method.
- A price-change-aware feature, such as days since the last change, for the promotion weak spot.
- Joint ordering across items with shared constraints, instead of independent per-series decisions.` },
    ] },
  },
];

export const LINKS = {
  email: 'mithijain220405@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mithi-jain-856825330/',
  github: 'https://github.com/Mithijain22',
};

// Hero: one image per letter of NAME, in order (shown on hover).
export const HERO_IMAGES = ['/img/m.jpg', '/img/i1.jpg', '/img/t.jpg', '/img/h.jpg', '/img/i2.jpg'];
export const HERO_SCRIPT = 'Hello';

// Small corner text on the loading screen (placeholders).
export const LOADER_TEXT = {
  tl: ['Year: 2026', 'Dept. of Product'],
  tr: ['PORTFOLIO', 'CASE STUDIES'],
  bl: ['EXHIBIT', 'COLLECTION'],
};
