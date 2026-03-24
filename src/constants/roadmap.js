/**
 * Trading Roadmap data — 16 phases, 86 topics.
 * Extracted from trading-roadmap-v2.html into a proper ES module.
 */

export const PHASES = [
  // ─────────────────────────────────────────────
  // PHASE 1: FOUNDATION & MINDSET
  // ─────────────────────────────────────────────
  {
    id: 'p1', label: 'Phase 1 — Foundation & Mindset', num: '01', est: '2–3 weeks',
    color: '#2a7a50', light: '#d1fae5', bg: 'rgba(42,122,80,0.09)', check: '#2a7a50',
    nodes: [
      {
        id: 'why-fail', title: 'Why Most Traders Fail', sub: 'The brutal honest truth before you start',
        phase: 'Foundation', diff: 1,
        summary: 'Before learning a single chart pattern, you must understand the statistical reality: 70–90% of retail traders lose money (per ESMA, FINRA, and 2025 studies). The reasons are predictable and avoidable — but only if you face them head-on from day one.',
        concepts: ['The 70–90% loss reality: documented across multiple regulators and studies (ESMA, FINRA, CFTC)','Undercapitalization and unrealistic return expectations','Overtrading: too many trades, too large positions','Chasing losses and revenge trading','Lack of a written trading plan','Treating trading as gambling vs a business','No edge — random entries with inconsistent exits','Ignoring transaction costs and slippage','Poor psychological framework under live P&L stress','Not backtesting or forward testing before going live','Copying others without understanding the underlying logic','Survivorship bias: only hearing success stories'],
        resources: [{type:'Book',name:'Trading in the Zone — Mark Douglas'},{type:'Book',name:'The Psychology of Trading — Brett Steenbarger'},{type:'Video',name:'Why Retail Traders Lose — SMB Capital (YouTube)'},{type:'Article',name:'ESMA Report: CFD Trader Profitability Study'},{type:'Podcast',name:'Chat With Traders — episode archive'}],
        tip: 'Write down your three biggest psychological weaknesses before you trade a single dollar. Awareness is the first edge.'
      },
      {
        id: 'types-traders', title: 'Types of Traders', sub: 'Find your style before you find your strategy',
        phase: 'Foundation', diff: 1,
        summary: 'Every successful trader has a style aligned with their personality, schedule, risk tolerance, and capital. Understanding the archetypes helps you stop copying strategies that are incompatible with who you are.',
        concepts: ['Scalper: seconds to minutes, high frequency, tiny margins','Day trader: intraday only, flat by close, PDT rules apply','Swing trader: days to weeks, part-time friendly','Position trader: weeks to months, macro-driven','Trend follower: systematic, rides large moves','Mean reversion trader: fades extremes back to average','News/catalyst trader: event-driven, pre-market focus','Algorithmic/quant trader: code-first, systematic','Options income trader: premium collection, defined risk','Market maker / arbitrageur: institutional-level execution'],
        resources: [{type:'Book',name:'Reminiscences of a Stock Operator — Edwin Lefèvre'},{type:'Book',name:'Market Wizards — Jack Schwager'},{type:'Video',name:'Find Your Trading Style — Rayner Teo (YouTube)'},{type:'Article',name:'Investopedia: Trading Styles Overview'}],
        tip: 'The best style is the one you can execute without fighting your own personality. A swing trading strategy is useless if you obsessively check charts every 5 minutes.'
      },
      {
        id: 'asset-classes-deep', title: 'Asset Classes Deep Dive', sub: 'Equities, FX, futures, crypto, options',
        phase: 'Foundation', diff: 1,
        summary: 'Each asset class has distinct mechanics, hours, tax treatment, leverage availability, and participant base. Choosing the right market to specialize in is one of the most important early decisions.',
        concepts: ['Equities: common stock, preferred stock, ADRs, REITs','ETFs: equity, bond, commodity, leveraged, inverse','Forex: spot, forwards, swaps; majors, minors, exotics','Futures: standardized contracts, settlement, rollover, margin','Options: rights not obligations, calls and puts, expiry','Commodities: agricultural (corn, wheat, soy), energy (crude, nat gas), metals','Crypto: spot, perps, funding rates, on-chain dynamics','Fixed income: Treasuries, corporate bonds, yield curves','CFDs: Contract for Difference — leverage, no ownership','Index products: SPX, NDX, RUT, international indices','Correlation between asset classes during risk-on/off','Trading hours, liquidity windows per market'],
        resources: [{type:'Book',name:'A Random Walk Down Wall Street — Burton Malkiel'},{type:'Video',name:'Asset Classes Explained — The Plain Bagel'},{type:'Course',name:'CME Group: Introduction to Futures'},{type:'Article',name:'Investopedia: Asset Class Overview'}],
        tip: 'Master one market before touching another. Most traders spread across too many instruments and never develop deep pattern recognition in any.'
      },
      {
        id: 'capital-expectations', title: 'Capital & Realistic Expectations', sub: 'Math of returns, drawdowns, compounding',
        phase: 'Foundation', diff: 2,
        summary: 'Most traders overestimate returns and underestimate the capital needed to generate meaningful income. Understanding the math of compounding, drawdown recovery, and position sizing constraints is non-negotiable.',
        concepts: ['Minimum viable capital by style: scalping needs scale, swing needs less','PDT rule: $25,000 minimum for US day trading','Compounding math: 20% annual return on $10K vs $100K','Drawdown recovery math: -50% requires +100% to recover','The trader\'s dilemma: small accounts force over-risk','Realistic annual return targets: 15-50% is elite','Monthly income targets vs account size requirements','Cost of trading: commissions, data feeds, platform fees','Opportunity cost vs a passive index fund','Paper trading phase: no income, but learning costs money too','Scaling up responsibly: the 3x rule for account growth','Prop firm capital vs retail capital tradeoffs'],
        resources: [{type:'Article',name:'The Math of Drawdown Recovery — position sizing primer'},{type:'Tool',name:'Compound Interest Calculator — investor.gov'},{type:'Book',name:'The New Trading for a Living — Dr. Alexander Elder'},{type:'Video',name:'How Much Money to Start Trading — Real Talk'}],
        tip: 'Run the math in reverse: what annual return % do you need to hit your income goals? Is that realistic? If not, you need more capital, not more risk.'
      },
      {
        id: 'tools-setup', title: 'Trader\'s Toolkit', sub: 'Platform, data, hardware, software stack',
        phase: 'Foundation', diff: 1,
        summary: 'Your tools are your infrastructure. A slow platform, bad data feed, or cluttered workspace costs real money. Setting up properly from the start is a professional habit.',
        concepts: ['Charting platform: TradingView, ThinkorSwim, Sierra Chart, NinjaTrader','Broker selection: execution quality, fees, margin rates, API access','Level 2 / DOM access for equity and futures traders','Real-time data feed vs delayed data: when it matters','Multiple monitors: chart layout, news, watchlist, P&L','Hardware: fast CPU, stable internet, UPS backup','News feeds: Reuters Eikon, Bloomberg Terminal, Benzinga Pro','Screeners: Finviz, Trade Ideas, TC2000, Unusual Whales','Economic calendar: Forex Factory, Investing.com, MarketWatch','Trade journal software: Tradervue, TradesViz, Edgewonk','Reference tools: Koyfin, Macrotrends, FRED (Fed data)','Paper trading setup for safe practice before live'],
        resources: [{type:'Tool',name:'TradingView — charting & community'},{type:'Tool',name:'Finviz — stock screener & heatmaps'},{type:'Tool',name:'Forex Factory — economic calendar'},{type:'Video',name:'Day Trader Setup Tour — YouTube'}],
        tip: 'Resist the urge to subscribe to 10 paid tools at once. Master free tools first (TradingView basic + Finviz). Add tools only when you know exactly what gap they fill.'
      },
      {
        id: 'learning-system', title: 'Building Your Learning System', sub: 'How to study trading effectively',
        phase: 'Foundation', diff: 1,
        summary: 'Trading is a skill that requires deliberate practice, feedback loops, and structured learning. How you study matters as much as what you study.',
        concepts: ['Deliberate practice vs passive consumption','Spaced repetition for concepts and patterns','Trade journaling as a learning feedback system','Screen time: chart reading as pattern recognition','Study one concept deeply, then add the next','Backtesting by hand: print charts and annotate','Mentor vs self-taught considerations','Online communities: Discord, Reddit, Twitter (caveats)','Book reading cadence and active note-taking','Simulation trading with graded difficulty','Setting weekly and monthly learning goals','Avoiding information overload and paralysis by analysis'],
        resources: [{type:'Book',name:'Mastery — Robert Greene'},{type:'Book',name:'The Talent Code — Daniel Coyle'},{type:'Video',name:'How I\'d Learn Trading From Scratch — mentorship perspective'},{type:'Article',name:'Deliberate Practice Framework — Anders Ericsson summary'}],
        tip: 'Spend more time reviewing past trades than looking for new ones. The answers to your growth are already in your trade history.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 2: MARKET INFRASTRUCTURE
  // ─────────────────────────────────────────────
  {
    id: 'p2', label: 'Phase 2 — Market Infrastructure', num: '02', est: '2–3 weeks',
    color: '#1d6fa4', light: '#dbeafe', bg: 'rgba(29,111,164,0.09)', check: '#1d6fa4',
    nodes: [
      {
        id: 'exchange-mechanics', title: 'Exchange Mechanics', sub: 'How orders become trades',
        phase: 'Infrastructure', diff: 2,
        summary: 'Markets are systems for matching buyers and sellers. Understanding how orders are processed, routed, and executed gives you insight that most retail traders completely skip.',
        concepts: ['NYSE vs NASDAQ: auction vs electronic market model','CME, CBOE, ICE: futures and options exchanges','Central Limit Order Book (CLOB): how bids and asks queue','Price priority vs time priority in order matching','Pre-open auction and price discovery','Continuous trading session vs call auction','Dark pools: ATS and off-exchange trading','Payment for order flow (PFOF) and retail trade routing','Clearinghouses: DTCC, CME Clearing — counterparty risk removal','T+1 settlement (US equities/bonds since May 2024) — what happens after the trade','Short interest: borrowing, locate requirements, recalls','Stock halts: news pending, circuit breakers, regulatory'],
        resources: [{type:'Book',name:'Flash Boys — Michael Lewis'},{type:'Paper',name:'SEC Market Structure White Papers'},{type:'Video',name:'How the Stock Market Actually Works — Patrick Boyle'},{type:'Article',name:'FINRA: Understanding Markets'}],
        tip: 'Your trade doesn\'t just go to one exchange. Understanding routing helps explain why execution quality varies across brokers.'
      },
      {
        id: 'market-participants', title: 'Market Participants', sub: 'Who you\'re trading against and why',
        phase: 'Infrastructure', diff: 2,
        summary: 'Markets are a conflict between participants with vastly different information, capital, time horizons, and intentions. Knowing who creates the moves you trade is a major edge.',
        concepts: ['Retail traders: emotional, pattern-following, late to moves','Institutional investors: pension funds, mutual funds — size-constrained','Hedge funds: macro, quant, long/short equity — various strategies','High-frequency traders (HFT): liquidity provision and arbitrage','Market makers: obligated to quote, profit from spread + rebates','Corporate insiders: 10b5-1 plans, blackout windows','Options market makers: delta-hedging creating directional flow','CTAs and systematic funds: trend-following algorithms','Family offices: discretionary, long time horizon','Prop trading firms: capital-leveraged risk takers','The informed trader vs uninformed trader dynamic','Institutional order flow and why it moves markets'],
        resources: [{type:'Book',name:'Reminiscences of a Stock Operator — Edwin Lefèvre'},{type:'Video',name:'Who Moves the Markets? — Real Vision'},{type:'Paper',name:'Kyle 1985: Continuous Auctions and Insider Trading (academic)'}],
        tip: 'Before every trade ask: who is on the other side? A retail trader buying a breakout is often selling to an institution distributing into strength.'
      },
      {
        id: 'market-makers-liquidity', title: 'Market Makers & Liquidity', sub: 'Spread, depth, slippage, impact',
        phase: 'Infrastructure', diff: 2,
        summary: 'Liquidity is the ability to enter and exit without dramatically moving the price. Understanding market makers helps you avoid the hidden costs that erode retail traders\' profits.',
        concepts: ['Bid-ask spread: the cost of immediacy','Market maker inventory risk and how they manage it','Depth of book: how many shares/contracts at each level','Market impact: your order moving the price against you','Slippage: difference between expected and actual fill','Liquidity vs illiquidity: when spreads widen','Pre-market and after-hours: lower liquidity, higher spread','Options bid-ask spreads and the cost to trade them','NBBO: National Best Bid and Offer — your legal fill right','Liquidity in crisis: flash crashes and empty books','HFT role: providing liquidity and extracting it','Liquidity premium in asset pricing'],
        resources: [{type:'Book',name:'Market Microstructure Theory — Maureen O\'Hara'},{type:'Video',name:'Bid-Ask Spread Deep Dive — YouTube'},{type:'Article',name:'Investopedia: Market Maker Definition'}],
        tip: 'The bid-ask spread is a hidden tax on trading. Multiply it by your position size — it adds up fast. Always use limit orders when you can.'
      },
      {
        id: 'order-types', title: 'Order Types Mastery', sub: 'Market, limit, stop, conditional orders',
        phase: 'Infrastructure', diff: 2,
        summary: 'Orders are your primary tool for executing your plan. Using the wrong order type costs money, creates slippage, or results in missed entries. Most retail traders only know 2 of the dozen+ available.',
        concepts: ['Market order: immediate fill at current price, slippage risk','Limit order: set price or better, may not fill','Stop market order: triggers market order at price','Stop limit order: triggers limit at price (risk of no fill)','Trailing stop: dynamic exit, follows price by amount or %','Market on Close (MOC) and Limit on Close (LOC)','Market on Open (MOO) and Limit on Open (LOO)','One Cancels Other (OCO): bracket orders for trade management','One Triggers Other (OTO): entry triggers stop + target','Good Till Canceled (GTC) vs Day orders','Immediate or Cancel (IOC) and Fill or Kill (FOK)','Conditional orders: trigger based on price, volume, or time'],
        resources: [{type:'Video',name:'All Order Types Explained — Warrior Trading'},{type:'Article',name:'Investopedia: Order Types'},{type:'Tool',name:'ThinkorSwim bracket order setup guide'}],
        tip: 'Always have your exit order in the market before you enter. The worst time to think about where to exit is when the trade is moving against you.'
      },
      {
        id: 'broker-advanced', title: 'Broker Selection & Account Setup', sub: 'Execution, margin, account types',
        phase: 'Infrastructure', diff: 1,
        summary: 'Your broker impacts every single trade you make. Execution quality, fee structure, margin rates, platform capability, and reliability all directly affect profitability.',
        concepts: ['Commission structure: per-share, flat rate, zero commission','Margin accounts: Reg T (50%) vs Portfolio Margin (15%)','PDT rule: 3 round trips in 5 days requires $25K','Short selling mechanics: locate, borrow cost, forced buybacks','Options approval levels: 1 through 5','Tax-advantaged trading: IRA, Roth IRA limitations','Broker API access for automated trading','Execution quality reports: how to read them','SIPC insurance and account protection','International brokers: IBKR, Saxo — benefits for non-US','Futures margin: SPAN margin vs equity margin','Clearing vs non-clearing brokers'],
        resources: [{type:'Tool',name:'Interactive Brokers (IBKR) — institutional-grade'},{type:'Tool',name:'ThinkorSwim/TD Ameritrade — best platform'},{type:'Tool',name:'Tastytrade — options-focused'},{type:'Article',name:'Broker comparison: NerdWallet 2024'}],
        tip: 'Check execution quality data before choosing a broker. PFOF brokers may show "free" commissions but sell your order flow — you pay via worse fills.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 3: READING PRICE & VOLUME
  // ─────────────────────────────────────────────
  {
    id: 'p3', label: 'Phase 3 — Reading Price & Volume', num: '03', est: '3–4 weeks',
    color: '#6b42c8', light: '#ede9fe', bg: 'rgba(107,66,200,0.09)', check: '#6b42c8',
    nodes: [
      {
        id: 'candlesticks', title: 'Candlestick & OHLC Fundamentals', sub: 'Price encoding, timeframes, reading bars',
        phase: 'Price Action', diff: 2,
        summary: 'Candlesticks are the primary language of price. Before learning patterns, you must deeply understand what each element of a candle reveals about the battle between buyers and sellers within a time period.',
        concepts: ['OHLC: Open, High, Low, Close and what each reveals','Body size: conviction of the session direction','Wick/shadow length: rejection and price discovery','Relationship between open and close: who won','Timeframe relativity: 1m, 5m, 15m, 1H, 4H, D, W, M','Choosing timeframe by trading style','Japanese candlestick origin: Homma Munehisa','Bar charts vs candlesticks vs line charts vs Heikin-Ashi','Point and Figure charts: removing time noise','Renko charts: removing noise with fixed brick size','Volume bars alongside price bars','Composite man concept: candle reads as intent'],
        resources: [{type:'Book',name:'Japanese Candlestick Charting Techniques — Steve Nison'},{type:'Video',name:'Candlesticks Explained — Adam Khoo (YouTube)'},{type:'Course',name:'TradingView Pine Script for candle patterns'}],
        tip: 'A candle tells a story. Ask: where did it open? Where did it try to go? Where did it end? That narrative is more valuable than the pattern name.'
      },
      {
        id: 'volume-fundamentals', title: 'Volume: Foundation of Conviction', sub: 'What volume reveals about price moves',
        phase: 'Price Action', diff: 2,
        summary: 'Volume is the fuel behind price movement. Price moves on high volume carry more weight. Price moves on low volume are suspect. Understanding volume is the first layer of context behind any chart.',
        concepts: ['Volume as proxy for institutional participation','High volume breakout vs low volume breakout','Volume on trend days vs consolidation days','Climax volume: exhaustion of buyers or sellers','Volume dry-up: lack of supply or demand before reversal','Comparative volume: today vs 10-day/20-day average','RVOL (Relative Volume): how hot is today?','Pre-market volume and its implications','Volume on gaps: gap up/down with/without volume','Volume divergence: price up, volume down — weakness','Volume profile vs time-based volume bars','Tick charts: equal-transaction-based price bars'],
        resources: [{type:'Book',name:'Volume Price Analysis — Anna Coulling'},{type:'Book',name:'Master the Markets — Tom Williams'},{type:'Video',name:'How to Read Volume Like a Pro — SMB Capital'}],
        tip: 'Volume is the hardest thing to fake. Price can be manipulated short-term; sustained volume tells a truer story about who is serious.'
      },
      {
        id: 'single-candle-patterns', title: 'Single Candle Patterns', sub: 'Doji, hammer, marubozu, shooting star',
        phase: 'Price Action', diff: 2,
        summary: 'Individual candles can signal exhaustion, indecision, or strong conviction. These patterns are most powerful at key levels — without context they are noise.',
        concepts: ['Doji: open = close, pure indecision','Gravestone doji: high-wick rejection of higher prices','Dragonfly doji: low-wick rejection of lower prices','Hammer: lower wick 2x+ body, bullish reversal signal','Hanging man: hammer at top = bearish','Inverted hammer and shooting star','Marubozu: no wicks, total conviction session','Bullish marubozu vs bearish marubozu','Spinning tops: small body, both wicks — indecision','High wave candle: extreme indecision, volatility','Pin bar: the most versatile rejection candle','The importance of location: pattern + level = signal'],
        resources: [{type:'Book',name:'Japanese Candlestick Charting Techniques — Steve Nison'},{type:'Video',name:'Single Candle Patterns — Rayner Teo'},{type:'Article',name:'Babypips.com: Candlestick Patterns Cheat Sheet'}],
        tip: 'A hammer at a prior support zone with rising volume is meaningful. A hammer in the middle of nowhere is just a shape.'
      },
      {
        id: 'multi-candle-patterns', title: 'Multi-Candle Patterns', sub: 'Engulfing, harami, morning star, three soldiers',
        phase: 'Price Action', diff: 2,
        summary: 'Multi-candle patterns capture the sequence of buyer-seller dynamics across 2-5 bars. They offer more information than single candles because they show how a battle unfolds over time.',
        concepts: ['Bullish engulfing: second candle engulfs first, reversal','Bearish engulfing: at tops, distribution signal','Harami (inside bar): consolidation, coiling energy','Bullish harami and bearish harami placement','Morning star: 3-candle reversal pattern at lows','Evening star: 3-candle reversal at highs','Three white soldiers: sustained buying pressure','Three black crows: sustained selling pressure','Tweezer tops and bottoms: double rejection','Dark cloud cover and piercing pattern','Three inside up/down: confirmation of harami','Kicker pattern: strongest reversal signal'],
        resources: [{type:'Book',name:'Encyclopedia of Candlestick Charts — Thomas Bulkowski'},{type:'Video',name:'Multi-Bar Candlestick Patterns — YouTube'},{type:'Article',name:'Investopedia: Complete Candlestick Pattern Guide'}],
        tip: 'Bulkowski\'s Encyclopedia rates each pattern by historical accuracy. Study the stats — not all patterns perform equally.'
      },
      {
        id: 'pure-price-action', title: 'Pure Price Action Trading', sub: 'Reading the market without indicators',
        phase: 'Price Action', diff: 3,
        summary: 'Price action trading means reading the market solely through the lens of price movement — no indicators, just understanding what price is doing, why, and where it is likely to go next.',
        concepts: ['What is price action: reading supply vs demand directly','Swing highs and swing lows: the building blocks of structure','Higher high, higher low sequence = uptrend','Lower high, lower low sequence = downtrend','Inside bars as consolidation and breakout setup','Outside bars as volatility expansion signals','Pinbar rejection trades: entry, stop, target logic','Breakout trades: what makes a valid breakout','Retrace-to-breakout: the most reliable entry','Price action at support, resistance, and key levels','Multiple timeframe price action confluence','Brooks Price Action methodology: context before pattern'],
        resources: [{type:'Book',name:'Price Action Trading Secrets — Rayner Teo'},{type:'Book',name:'Reading Price Charts Bar by Bar — Al Brooks'},{type:'Video',name:'Price Action Masterclass — Trading Rush (YouTube)'}],
        tip: 'Remove all indicators for 30 days and just read candles and structure. This forces you to understand the market itself rather than relying on lagging signals.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 4: MARKET STRUCTURE
  // ─────────────────────────────────────────────
  {
    id: 'p4', label: 'Phase 4 — Market Structure', num: '04', est: '2–3 weeks',
    color: '#2d8a6b', light: '#ccfbf1', bg: 'rgba(45,138,107,0.09)', check: '#2d8a6b',
    nodes: [
      {
        id: 'trend-identification', title: 'Trend Identification & Classification', sub: 'Primary, secondary, tertiary trends',
        phase: 'Structure', diff: 2,
        summary: 'Identifying the trend correctly is the foundation of every profitable trade setup. The wrong trend identification leads to fighting the market — the most expensive mistake in trading.',
        concepts: ['Dow Theory: primary, secondary, minor trends','The trend is your friend — until it bends','Uptrend: series of higher highs and higher lows','Downtrend: series of lower lows and lower highs','Sideways/ranging: equal highs and lows, no momentum','Trend strength: steep angle, clean pullbacks = strong','Trend age: early, established, and extended','Using multiple timeframes to confirm trend direction','Swing point identification: manual vs algorithmic','Trend lines: how to draw them correctly','Trend channels: parallel lines, measured moves','False breaks and trend continuation traps'],
        resources: [{type:'Book',name:'Dow Theory for the 21st Century — Jack Schannep'},{type:'Video',name:'How to Identify Trends — Rayner Teo'},{type:'Article',name:'Investopedia: Trend Trading Strategies'}],
        tip: 'Draw your trend lines from the actual swing highs/lows, not through wicks. Body-to-body trend lines often give better signals.'
      },
      {
        id: 'support-resistance', title: 'Support & Resistance: Foundation', sub: 'Horizontal levels, role reversal, confluence',
        phase: 'Structure', diff: 2,
        summary: 'Support and resistance are the core architecture of technical analysis. Price respects levels because human psychology creates repeating reactions at the same price zones.',
        concepts: ['Support: price level where buyers have historically overwhelmed sellers','Resistance: price level where sellers have historically overwhelmed buyers','Why S/R works: memory, institutional resting orders','Round numbers as psychological S/R','Role reversal: broken support becomes resistance (and vice versa)','How to draw S/R correctly: areas not lines','Strong vs weak levels: number of touches, timeframe','S/R on higher timeframes carries more weight','Confluence: multiple S/R types at same level','Broken S/R and the test-and-reject pattern','Using S/R for entries, stops, and targets','Volume at key levels: confirming significance'],
        resources: [{type:'Video',name:'Support & Resistance — The Complete Guide'},{type:'Book',name:'Technical Analysis of the Financial Markets — John Murphy'},{type:'Article',name:'Babypips: Drawing Support and Resistance'}],
        tip: 'Don\'t trade a level on the first touch unless you have exceptional additional confirmation. Wait for the second or third reaction to confirm the level is respected.'
      },
      {
        id: 'supply-demand', title: 'Supply & Demand Zones', sub: 'Origin zones, imbalance, fresh vs tested',
        phase: 'Structure', diff: 3,
        summary: 'Supply and demand zone analysis is the institutional-grade version of support and resistance. Instead of reactive levels, you identify the origin of moves and predict where pending orders remain.',
        concepts: ['Difference between S/R and supply/demand zones','Supply zone: origin of a bearish impulse move (unfilled sell orders)','Demand zone: origin of a bullish impulse move (unfilled buy orders)','Identifying the base before the move','Fresh zone vs tested zone: diminishing probability','Imbalance: price left an area too fast, creating unfinished business','Drop-Base-Rally (DBR): demand zone pattern','Rally-Base-Drop (RBD): supply zone pattern','Strong zones: sharp departure, large candles, clear imbalance','Zone drawing: candle body vs wicks debate','Price reaching a zone vs entering a zone','Combining zones with order flow confirmation'],
        resources: [{type:'Course',name:'Supply and Demand Trading — Sam Seiden (Online Trading Academy)'},{type:'Video',name:'Supply and Demand Explained — Tradeciety'},{type:'Book',name:'Secrets of a Professional Order Reader'}],
        tip: 'The farther and faster price moves away from a zone, the more unfilled orders remain there — and the stronger the reaction when price returns.'
      },
      {
        id: 'market-cycles', title: 'Market Cycles & Stages', sub: 'Wyckoff phases, four stages, accumulation/distribution',
        phase: 'Structure', diff: 3,
        summary: 'Markets move in recognizable cycles. Understanding the stage of the market helps you apply the right strategy — trending methods fail in ranges; range strategies fail in trends.',
        concepts: ['The four stages: accumulation, uptrend, distribution, downtrend','Stage 1: base building, institutional buying quietly','Stage 2: advancing/markup phase — trend traders\' zone','Stage 3: top formation, institutional selling','Stage 4: declining/markdown — only short sellers profit','How stages look on weekly/monthly charts','Stage analysis by Stan Weinstein','Market cycle length variation: sectors, indices, individual stocks','The business cycle and asset class rotation','Presidential cycle and seasonal patterns','Sector rotation: which sectors lead at each economic phase','How volume confirms stage transitions'],
        resources: [{type:'Book',name:'Secrets for Profiting in Bull and Bear Markets — Stan Weinstein'},{type:'Book',name:'Intermarket Analysis — John Murphy'},{type:'Video',name:'Market Stages Explained — Investopedia'}],
        tip: 'Never buy a Stage 4 stock no matter how cheap it looks. Wait for Stage 1 base building to complete before looking for entries.'
      },
      {
        id: 'break-of-structure', title: 'Break of Structure & Change of Character', sub: 'BOS, CHoCH, shift in market bias',
        phase: 'Structure', diff: 3,
        summary: 'Break of Structure (BOS) and Change of Character (CHoCH) are institutional-grade concepts for identifying when a trend is accelerating or reversing — far earlier than traditional indicators.',
        concepts: ['BOS (Break of Structure): continuation of existing trend','CHoCH (Change of Character): first sign of potential reversal','Identifying swing highs and lows algorithmically','Bullish BOS: price breaks above last significant high','Bearish BOS: price breaks below last significant low','CHoCH: lower high in uptrend or higher low in downtrend','Internal structure vs external structure','Using BOS to trail stops in trending trades','CHoCH as first entry signal for counter-trend traders','Liquidity sweep before BOS: the stop hunt','Smart money narrative: inducement before move','Multiple timeframe BOS confirmation'],
        resources: [{type:'Video',name:'Break of Structure Explained — ICT (YouTube)'},{type:'Video',name:'Market Structure for Beginners — LuxAlgo'},{type:'Article',name:'Smart Money Concepts: BOS and CHoCH Guide'}],
        tip: 'A CHoCH alone is not a trade signal — it\'s an alert to look for entry on the next BOS in the opposite direction.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 5: TECHNICAL ANALYSIS — CLASSICAL
  // ─────────────────────────────────────────────
  {
    id: 'p5', label: 'Phase 5 — Technical Analysis: Classical', num: '05', est: '4–6 weeks',
    color: '#b84a2a', light: '#fee2d4', bg: 'rgba(184,74,42,0.09)', check: '#b84a2a',
    nodes: [
      {
        id: 'moving-averages', title: 'Moving Averages', sub: 'SMA, EMA, WMA, VWAP, VWMA',
        phase: 'Classical TA', diff: 2,
        summary: 'Moving averages are the most widely used technical indicator. They smooth price noise to reveal trend direction and act as dynamic support and resistance. Knowing which type to use and why matters.',
        concepts: ['SMA (Simple Moving Average): equal weighting','EMA (Exponential Moving Average): recent price bias','WMA (Weighted Moving Average): linearly weighted','Key periods: 9, 20, 50, 100, 200 EMA/SMA','Golden cross (50 over 200 SMA) and death cross','EMA crossover systems: 8/21, 9/21 EMA','Moving average as dynamic support/resistance','Price relationship to 200 MA: macro trend filter','VWAP: volume-weighted average price — intraday anchor','Anchored VWAP: from earnings, IPO, or swing low','VWAP stretch entries: mean reversion','Moving average ribbons: multiple MAs for trend strength','Displacement from MA: reversal signal'],
        resources: [{type:'Book',name:'Moving Averages Simplified — Clif Droke'},{type:'Video',name:'Moving Averages Masterclass — Rayner Teo'},{type:'Article',name:'Investopedia: Moving Average Types'}],
        tip: 'VWAP is the most important intraday indicator for equity day traders. Institutional algorithms are benchmarked to it.'
      },
      {
        id: 'momentum-oscillators', title: 'Momentum Oscillators', sub: 'RSI, Stochastics, CCI, Williams %R',
        phase: 'Classical TA', diff: 2,
        summary: 'Momentum oscillators measure the speed and magnitude of price change. Used correctly, they identify overbought/oversold conditions and early divergence signals before price turns.',
        concepts: ['RSI (Relative Strength Index): 0-100, overbought/oversold','RSI default 14 periods: Wilder\'s formula','RSI divergence: bullish (price down, RSI up) and bearish','RSI failure swings: most powerful RSI signal','Stochastics: %K and %D, fast vs slow','Stochastic divergence and crossovers','CCI (Commodity Channel Index): deviations from mean','Williams %R: inverse stochastic, momentum','Rate of Change (ROC): pure momentum','Money Flow Index (MFI): volume-weighted RSI','Connors RSI: multi-component short-term mean reversion','Using oscillators in trend vs range environments'],
        resources: [{type:'Book',name:'New Concepts in Technical Trading Systems — Welles Wilder'},{type:'Video',name:'RSI Explained — TradingView YouTube'},{type:'Article',name:'Investopedia: RSI Deep Dive'}],
        tip: 'RSI divergence on a weekly chart is one of the most reliable signals in technical analysis. Daily divergence is noisy — weekly is significant.'
      },
      {
        id: 'macd', title: 'MACD: Trend + Momentum Confluence', sub: 'Histogram, signal line, crossovers, divergence',
        phase: 'Classical TA', diff: 2,
        summary: 'The MACD is one of the most versatile indicators — combining trend direction and momentum in a single tool. Understanding all three components and how they interact is essential.',
        concepts: ['MACD line: 12 EMA minus 26 EMA','Signal line: 9 EMA of MACD line','Histogram: MACD minus signal — momentum visualization','MACD crossover: signal line cross (lagging confirmation)','Histogram reversal: earliest signal, most actionable','MACD zero-line cross: trend confirmation','MACD divergence: most powerful MACD signal','Weekly MACD for trend confirmation','Daily MACD for entry timing','MACD in a ranging market: whipsaws and false signals','Tweaking MACD settings: 3/10/16 for faster signals','Combining MACD with support/resistance'],
        resources: [{type:'Book',name:'MACD Trading — Gerald Appel'},{type:'Video',name:'MACD Mastery Guide — YouTube'},{type:'Article',name:'Investopedia: MACD Indicator Explained'}],
        tip: 'The histogram shrinking (zero-line crossover in progress) is more actionable than waiting for the line crossover itself — you get in earlier with better R/R.'
      },
      {
        id: 'volatility-indicators', title: 'Volatility Indicators', sub: 'Bollinger Bands, ATR, Keltner, VIX',
        phase: 'Classical TA', diff: 2,
        summary: 'Volatility indicators measure how much price is moving and whether it is expanding or contracting. Volatility is cyclical — low volatility precedes high volatility. Knowing this creates trade setups.',
        concepts: ['Bollinger Bands: 20 SMA ± 2 standard deviations','Bollinger Band width: contraction = squeeze, expansion = breakout','BB squeeze: low volatility setup before big move','Walking the bands: trend continuation signal','%B: where price is within the bands','ATR (Average True Range): absolute volatility measure','ATR-based stops: 1.5x or 2x ATR below entry','Keltner Channels: EMA + ATR-based bands','Donchian Channels: N-period high/low breakout system','VIX: market fear gauge, S&P 500 implied volatility','VIX term structure: contango vs backwardation','Historical volatility vs implied volatility divergence'],
        resources: [{type:'Book',name:'Bollinger on Bollinger Bands — John Bollinger'},{type:'Video',name:'ATR and Bollinger Bands — YouTube'},{type:'Tool',name:'VIX Central: VIX term structure tracker'}],
        tip: 'The Bollinger Band squeeze (width at 6-month lows) is one of the cleanest pre-breakout setups in trading. John Bollinger\'s own strategy.'
      },
      {
        id: 'volume-indicators', title: 'Volume Indicators', sub: 'OBV, A/D Line, CMF, VPOC, MFI',
        phase: 'Classical TA', diff: 2,
        summary: 'Volume indicators translate raw volume data into actionable signals by comparing it to price direction. They help confirm moves and warn of divergences that raw price charts miss.',
        concepts: ['OBV (On-Balance Volume): cumulative volume by direction','OBV divergence: leading indicator of price reversal','Accumulation/Distribution Line: close location × volume','Chaikin Money Flow (CMF): sustained buying or selling pressure','Volume Rate of Change: acceleration of volume','Force Index: price change × volume — conviction measure','Ease of Movement: price movement per unit of volume','VWAP bands: institutional levels around volume anchor','Volume by Price: horizontal histogram showing traded volume','Point of Control (VPOC): most traded price level','Value Area: 70% of volume — high and low','Volume delta: buying volume vs selling volume imbalance'],
        resources: [{type:'Book',name:'Volume Spread Analysis — Tom Williams'},{type:'Video',name:'Volume Indicators Explained — YouTube'},{type:'Tool',name:'Market Delta / Bookmap for order flow visualization'}],
        tip: 'OBV divergence before a price reversal is one of the most reliable leading signals. Track OBV on your watchlist stocks weekly.'
      },
      {
        id: 'chart-patterns-continuation', title: 'Chart Patterns: Continuation', sub: 'Flags, pennants, wedges, triangles, cup-and-handle',
        phase: 'Classical TA', diff: 3,
        summary: 'Continuation patterns represent pauses within trends — consolidation phases where price digests gains before continuing. They offer reliable entry setups with defined risk and measured targets.',
        concepts: ['Bull flag: sharp rally, tight consolidation, breakout','Bear flag: sharp decline, brief relief, continuation','Bull pennant vs bear pennant: symmetrical consolidation','Ascending triangle: flat resistance + rising lows','Descending triangle: flat support + falling highs','Symmetrical triangle: two converging trend lines','Rectangle: horizontal consolidation channel','Wedge (falling): higher lows/highs converging down = bullish','Wedge (rising): converging up in downtrend = bearish','Cup and handle: Wm O\'Neil\'s classic pattern','Measured moves: projecting targets from pattern height','Volume signature within patterns: should dry up, expand on breakout'],
        resources: [{type:'Book',name:'How to Make Money in Stocks — William O\'Neil'},{type:'Book',name:'Encyclopedia of Chart Patterns — Thomas Bulkowski'},{type:'Video',name:'Chart Pattern Guide — TradingView YouTube'}],
        tip: 'Low-volume consolidation followed by high-volume breakout is the textbook continuation setup. Any breakout on average or below-average volume should be questioned.'
      },
      {
        id: 'chart-patterns-reversal', title: 'Chart Patterns: Reversal', sub: 'Head and shoulders, double top/bottom, rounding',
        phase: 'Classical TA', diff: 3,
        summary: 'Reversal patterns mark the transition between trend phases. They take time to form — longer formation = more powerful signal. Each has precise entry, stop, and target rules.',
        concepts: ['Head and shoulders (H&S): left shoulder, head, right shoulder, neckline','H&S measured target: neckline to head distance projected down','Inverse H&S (iH&S): bullish reversal at lows','Double top: M pattern — two peaks at same resistance','Double bottom: W pattern — two troughs at same support','Triple tops and triple bottoms: stronger confirmation','Rounding bottom (saucer): long-term accumulation','Rounding top: distribution phase, slow deterioration','Broadening formations: megaphone pattern, extreme volatility','Island reversal: gap up, consolidation, gap down — trapped bulls','Key reversal day: new high/low then close opposite direction','Failed patterns: how they create the best trades'],
        resources: [{type:'Book',name:'Technical Analysis of Stock Trends — Edwards & Magee'},{type:'Book',name:'Encyclopedia of Chart Patterns — Thomas Bulkowski'},{type:'Video',name:'Head and Shoulders Complete Guide — YouTube'}],
        tip: 'Wait for the neckline break with volume before acting on H&S. Trading the pattern too early is the most common mistake.'
      },
      {
        id: 'fibonacci', title: 'Fibonacci Analysis', sub: 'Retracements, extensions, confluence zones',
        phase: 'Classical TA', diff: 3,
        summary: 'Fibonacci ratios appear throughout nature and markets. Price consistently respects key Fibonacci levels because enough traders act on them — making them self-fulfilling, and genuinely predictive of institutional order placement.',
        concepts: ['The Fibonacci sequence and golden ratio (1.618)','Key retracement levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%','The 61.8% retracement: the golden ratio level','Fibonacci extensions: 127.2%, 161.8%, 261.8%','How to draw retracements: from significant swing low to high','Fibonacci clusters: multiple fibs converging at one level','Confluence trading: fib + S/R + moving average','Fibonacci time zones: less reliable, still useful','ABCD pattern: harmonic pattern using fib ratios','Fibonacci fan lines and arcs','Using extensions to project profit targets','Common mistakes: wrong swing selection, ignoring trend'],
        resources: [{type:'Book',name:'Fibonacci Trading — Carolyn Boroden'},{type:'Video',name:'Fibonacci Retracement Mastery — YouTube'},{type:'Article',name:'Investopedia: Fibonacci Retracements Guide'}],
        tip: 'The 61.8% retracement (golden ratio) is the most powerful fib level. A price rejection there in trend direction is one of the highest-probability entries in technical analysis.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 6: TECHNICAL ANALYSIS — ADVANCED
  // ─────────────────────────────────────────────
  {
    id: 'p6', label: 'Phase 6 — Technical Analysis: Advanced', num: '06', est: '4–6 weeks',
    color: '#c07a10', light: '#fef3c7', bg: 'rgba(192,122,16,0.09)', check: '#c07a10',
    nodes: [
      {
        id: 'wyckoff', title: 'Wyckoff Method', sub: 'Accumulation, distribution, springs, upthrusts',
        phase: 'Advanced TA', diff: 4,
        summary: 'The Wyckoff Method is a complete trading philosophy developed by Richard Wyckoff in the 1930s. It reads the market through the lens of a "Composite Operator" — the collective force of smart money — and identifies when they are accumulating or distributing large positions.',
        concepts: ['The three laws: supply & demand, cause & effect, effort vs result','The Composite Operator concept','Accumulation schematic: PS, SC, AR, ST, Spring, SOS, LPS','Distribution schematic: PSY, BC, AR, ST, UTAD, LPSY','Phase A–E analysis in both schematics','Spring: shakeout below support to trap shorts before rally','Upthrust (UTAD): fake breakout above resistance before decline','Signs of Strength (SOS) and Signs of Weakness (SOW)','Volume analysis in each phase','Point and Figure for target projection in Wyckoff','Wyckoff on charts: how to identify current phase','Application to crypto, equities, and futures'],
        resources: [{type:'Book',name:'The Wyckoff Methodology in Depth — Rubén Villahermosa'},{type:'Course',name:'Wyckoff Stock Market Institute materials'},{type:'Video',name:'Wyckoff Accumulation Explained — SMC YouTube'}],
        tip: 'The Spring (shakeout below support) is the highest-probability long entry in the Wyckoff method. Wait for the test of the Spring — the secondary test is your entry.'
      },
      {
        id: 'elliott-wave', title: 'Elliott Wave Theory', sub: 'Impulse waves, corrective waves, Fibonacci relationship',
        phase: 'Advanced TA', diff: 5,
        summary: 'Elliott Wave Theory proposes that market prices move in specific patterns called waves, which reflect the collective psychology of market participants. It is complex but powerful when used as a framework rather than a rigid system.',
        concepts: ['5-wave impulse structure: 1, 2, 3, 4, 5','3-wave corrective structure: A, B, C','Rules: wave 2 never below wave 1, wave 3 never shortest','Guidelines: wave 3 typically extended, alternation in corrections','Fibonacci relationships between waves','Motive vs corrective waves','Complex corrections: zigzag, flat, triangle, double/triple three','Leading and ending diagonals','Wave personality: character of each wave','Nested waves: fractal nature of markets','Practical Elliott Wave: use as probability framing not prediction','Common mistakes and wave subjectivity'],
        resources: [{type:'Book',name:'Elliott Wave Principle — Frost & Prechter'},{type:'Book',name:'Mastering Elliott Wave — Glenn Neely'},{type:'Video',name:'Elliott Wave Explained — YouTube'}],
        tip: 'Use Elliott Wave to understand where you are in the big picture, not to make precise short-term trades. The value is context, not exact prediction.'
      },
      {
        id: 'ict-smc', title: 'ICT / Smart Money Concepts', sub: 'Order blocks, FVG, liquidity sweeps, displacement',
        phase: 'Advanced TA', diff: 4,
        summary: 'Smart Money Concepts (SMC) and ICT (Inner Circle Trader) methodology focuses on how institutional participants manipulate price to fill large orders. It provides a framework for reading liquidity hunts, order blocks, and displacement moves.',
        concepts: ['Order blocks: last down candle before up move (bullish OB) and vice versa','Fair Value Gaps (FVG): three-candle imbalance, price returns to fill','Liquidity: where retail stop orders cluster (equal highs/lows, trend lines)','Liquidity sweep: price temporarily breaks levels to trigger stops, then reverses','Premium vs Discount arrays: buy in discount, sell in premium','Optimal Trade Entry (OTE): 61.8–79% retracement of displacement','Market Structure Shift (MSS): same as Change of Character','PD Arrays: Order Blocks, FVG, Breaker Blocks, Mitigation Blocks','Session analysis: Asian, London, New York kill zones','Killzone trading: high-probability institutional time windows','Judas swing: false move at session open to mislead retail','Displacement: large, impulsive move away from a zone','Important: core ideas overlap heavily with traditional price action — treat as a framework, not secret institutional code. Always backtest'],
        resources: [{type:'Video',name:'ICT Mentorship — Michael J. Huddleston (YouTube - free)'},{type:'Video',name:'Smart Money Concepts Guide — The Trading Geek'},{type:'Book',name:'Inner Circle Trader: Official Core Content'}],
        tip: 'SMC works best when you combine Order Block + FVG + liquidity sweep — all three agreeing. A single factor is not enough confirmation.'
      },
      {
        id: 'harmonic-patterns', title: 'Harmonic Patterns', sub: 'Gartley, Bat, Butterfly, Crab, Shark',
        phase: 'Advanced TA', diff: 4,
        summary: 'Harmonic patterns are specific price structures defined by Fibonacci ratios at each turning point. When all ratios align, they form a Potential Reversal Zone (PRZ) with high probability.',
        concepts: ['The ABCD pattern: foundation of all harmonic patterns','Gartley pattern: 0.618 retracement at B, 0.786 at D','Bat pattern: 0.382–0.500 at B, 0.886 at D','Butterfly pattern: 0.786 at B, 1.27–1.618 at D (extension)','Crab pattern: tightest XA retracement, 1.618 at D','Deep Crab: 0.886 B retracement variant','Shark pattern: 0.886 at B, 1.13–1.618 at D','Three Drives pattern: three impulse waves','Cypher pattern: beyond 0.618 at C, 0.786 at D','PRZ: Potential Reversal Zone — where multiple fibs converge','Entry at the PRZ: candle confirmation + volume','Invalidation levels: clear rules for cutting the loss'],
        resources: [{type:'Book',name:'Harmonic Trading Vol 1 — Scott Carney'},{type:'Book',name:'Harmonic Trading Vol 2 — Scott Carney'},{type:'Tool',name:'Auto Harmonic Pattern indicators on TradingView'}],
        tip: 'Never enter a harmonic trade without confirmation at the PRZ. Price often overshoots the PRZ — wait for a rejection candle before committing.'
      },
      {
        id: 'multi-timeframe', title: 'Multi-Timeframe Analysis', sub: 'Top-down analysis, alignment, conflict resolution',
        phase: 'Advanced TA', diff: 3,
        summary: 'Multi-timeframe analysis (MTF) is the practice of analyzing the same market across different timeframes to gain context. The higher timeframe sets the bias; lower timeframes refine the entry.',
        concepts: ['Top-down analysis: start big, work small','Timeframe hierarchy: Monthly → Weekly → Daily → 4H → 1H → 15m','Higher timeframe bias: only trade in direction of HTF trend','Lower timeframe entry: use LTF for precise entry, tight stop','The 4:1 rule: trade in direction of one timeframe up','Conflict: when HTF and LTF disagree — step aside','Multi-timeframe S/R: higher TF levels carry more weight','VWAP across timeframes for intraday context','Daily chart as anchor for swing traders','Weekly chart as anchor for position traders','How to avoid timeframe hopping under pressure','Charting layouts: multi-screen or split-screen setup'],
        resources: [{type:'Book',name:'Trading Your Way to Financial Freedom — Van Tharp'},{type:'Video',name:'Multi-Timeframe Analysis Guide — Trading 212 YouTube'},{type:'Article',name:'TradingView: Multi-Timeframe Tutorial'}],
        tip: 'If you\'re trading a 15-minute chart, your stop should be based on 15-minute structure, but your bias should come from the daily chart.'
      },
      {
        id: 'intermarket-technical', title: 'Intermarket Technical Relationships', sub: 'Correlations between stocks, bonds, commodities, FX',
        phase: 'Advanced TA', diff: 4,
        summary: 'No market trades in isolation. Understanding how different markets relate to each other — and when those relationships break down — provides macro context that pure chart reading cannot offer.',
        concepts: ['Stocks vs bonds: inverse relationship in risk-off','Yields up → growth stocks down (duration impact)','DXY (Dollar Index): inverse to commodities and EM','Gold vs dollar: historically inverse','Oil and energy stocks: correlated, leadership and lag','Copper as economic barometer','VIX and S&P 500: inverse, non-linear','Risk-on / risk-off regime detection','Carry trade dynamics in FX','Credit spreads (HY vs IG) as leading equity indicator','Sector rotation within equities: defensive vs cyclical','Using intermarket signals to confirm or fade breakouts'],
        resources: [{type:'Book',name:'Intermarket Analysis — John Murphy'},{type:'Book',name:'Technical Analysis of the Financial Markets — John Murphy'},{type:'Video',name:'Intermarket Relationships — Real Vision Finance'}],
        tip: 'When multiple markets give conflicting signals (e.g., stocks making new highs but yields and credit spreads widening), reduce position sizes. The market is sending a warning.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 7: ORDER FLOW & MICROSTRUCTURE
  // ─────────────────────────────────────────────
  {
    id: 'p7', label: 'Phase 7 — Order Flow & Market Microstructure', num: '07', est: '3–4 weeks',
    color: '#1a6fa4', light: '#e0f2fe', bg: 'rgba(26,111,164,0.09)', check: '#1a6fa4',
    nodes: [
      {
        id: 'level2-dom', title: 'Level 2, DOM & Order Book', sub: 'Reading depth, iceberg orders, spoofing',
        phase: 'Order Flow', diff: 4,
        summary: 'Level 2 data and the Depth of Market (DOM) show all resting limit orders at every price level. This "order book" gives a glimpse into supply and demand before it manifests in price.',
        concepts: ['Level 1 vs Level 2 data: what you see in each','Market depth: total shares/contracts available at each price','DOM: Depth of Market ladder — futures standard interface','Large orders on the book: potential support/resistance','Iceberg orders: hidden size, visible portion only','Spoofing: placing and canceling large orders (illegal but common)','Layering: multiple orders across levels to mislead','Pulling liquidity: orders disappearing when price approaches','Stacked bids/asks: strength or weakness signal','Absorption: large orders consuming all market orders','Momentum vs absorption: price reaction to order arrival','Tools: Bookmap, Jigsaw Trading, Sierra Chart DOM'],
        resources: [{type:'Video',name:'Reading Level 2 — SMB Capital YouTube'},{type:'Course',name:'Jigsaw Trading: Order Flow Education'},{type:'Tool',name:'Bookmap — visual DOM and heatmap'}],
        tip: 'Spoofing is rampant. Never trust a large order on the DOM until price actually reacts to it. Watch what happens when price approaches — does it stay or disappear?'
      },
      {
        id: 'tape-reading', title: 'Tape Reading & Time & Sales', sub: 'Print flow, sweeps, large blocks',
        phase: 'Order Flow', diff: 4,
        summary: 'Tape reading is the art of interpreting the real-time stream of transactions (Time & Sales). Experienced tape readers can gauge momentum, institutional footprints, and exhaustion directly from the prints.',
        concepts: ['Time & Sales: every transaction, price, size, timestamp','The color code: green = uptick, red = downtick (broker-specific)','Large prints: institutional block trades','Market order vs limit order fills: how to distinguish','Speed of tape: acceleration = momentum building','Tape drying up: exhaustion before reversal','Sweeping the ask: aggressive buying, urgency','Hitting the bid: aggressive selling, urgency','Large uptick print at resistance = potential distribution','Sector tape: reading multiple stocks simultaneously','Tape reading with Level 2 integration','Developing speed: takes months of screen time'],
        resources: [{type:'Video',name:'Tape Reading Masterclass — Investors Underground'},{type:'Book',name:'Tape Reading and Market Tactics — Humphrey Neill'},{type:'Tool',name:'Sterling Trader Pro / DAS Trader for tape'}],
        tip: 'Tape reading is a skill that takes 6–12 months to develop for most. Practice with small size first and focus on identifying large institutional prints.'
      },
      {
        id: 'footprint-charts', title: 'Footprint Charts & Delta Analysis', sub: 'Bid/ask volume per bar, delta divergence',
        phase: 'Order Flow', diff: 4,
        summary: 'Footprint charts display the volume transacted at each price level within each candlestick — broken down by buys (lifts) and sells (hits). Delta analysis shows the net imbalance between aggressive buyers and sellers.',
        concepts: ['Footprint chart types: bid×ask, delta, imbalance, total volume','Bid volume vs ask volume per price level','Delta: net difference between buying and selling volume','Cumulative delta: running total of buyer/seller aggressiveness','Delta divergence: price goes up but delta negative = absorption by sellers','Positive delta at bottom = buyers stepping in','Imbalance cells: 200%+ ratio of bid vs ask (or vice versa)','High volume nodes within bars: contested price levels','POC within a bar: most traded price','Stacked imbalances: high-conviction directional flow','Volume by price with bid/ask breakdown','Tools: Bookmap, Sierra Chart, Market Delta, CQG'],
        resources: [{type:'Tool',name:'Sierra Chart with MarketDelta charts'},{type:'Course',name:'Orderflows.com: Footprint trading course'},{type:'Video',name:'Footprint Charts Explained — YouTube'}],
        tip: 'Delta divergence is the most powerful footprint signal: if price makes a new high but delta is negative, sellers are absorbing every rally — reversal likely.'
      },
      {
        id: 'volume-profile-advanced', title: 'Volume Profile: Advanced', sub: 'VPOC, VAH, VAL, HVN, LVN, developing profiles',
        phase: 'Order Flow', diff: 4,
        summary: 'Volume Profile distributes traded volume horizontally across price levels rather than time. This creates a market profile showing where the most (and least) business was done — and where price is likely to react.',
        concepts: ['Volume Profile vs traditional volume bars','POC (Point of Control): highest volume price level','Value Area: 70% of session volume — VAH and VAL','High Volume Nodes (HVN): attraction zones, price lingers here','Low Volume Nodes (LVN): fast-travel zones, price gaps through here','Single prints: auctioned once, revisit often','TPO (Time Price Opportunity) charts: Market Profile','Composite volume profile: multiple sessions merged','Developing profile: building the current session','Naked POC: untested POC from prior session = magnet','Volume at price as invisible S/R','Micro composite: 5-day, 20-day profiles for context'],
        resources: [{type:'Tool',name:'Sierra Chart — full Volume Profile support'},{type:'Course',name:'MarketDelta / Jigsaw Volume Profile course'},{type:'Video',name:'Volume Profile Complete Guide — YouTube'},{type:'Book',name:'Mind Over Markets — Dalton, Jones, Dalton'}],
        tip: 'Price always seeks to return to untested POCs (Naked POC). They act like magnets. Mark them on your chart and use them as targets.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 8: FUNDAMENTAL ANALYSIS — EQUITIES
  // ─────────────────────────────────────────────
  {
    id: 'p8', label: 'Phase 8 — Fundamental Analysis: Equities', num: '08', est: '3–4 weeks',
    color: '#a03070', light: '#fce7f3', bg: 'rgba(160,48,112,0.09)', check: '#a03070',
    nodes: [
      {
        id: 'financial-statements', title: 'Financial Statements Deep Dive', sub: 'Income statement, balance sheet, cash flow',
        phase: 'Fundamentals', diff: 3,
        summary: 'Every stock is a fractional ownership in a business. Understanding the three financial statements tells you whether a business is growing, profitable, financially sound, and generating real cash.',
        concepts: ['Income statement: revenue, gross profit, operating income, net income','Gross margin: pricing power and cost structure','Operating leverage: fixed vs variable costs','EBITDA: operating profitability before non-cash charges','EPS (Earnings Per Share): net income per diluted share','Balance sheet: assets, liabilities, shareholders\' equity','Current ratio: short-term liquidity','Debt-to-equity ratio: financial leverage','Book value: net asset value per share','Cash flow statement: operations, investing, financing','Free Cash Flow (FCF): cash left after capex','Quality of earnings: accrual vs cash-based earnings'],
        resources: [{type:'Book',name:'Financial Statements — Thomas Ittelson'},{type:'Book',name:'How to Read a Financial Report — John Tracy'},{type:'Course',name:'CFA Institute: Financial Statement Analysis (free resources)'},{type:'Tool',name:'Macrotrends.net for historical financial data'}],
        tip: 'Focus on Free Cash Flow over net income. Earnings can be manipulated with accounting choices; cash flow is much harder to fake.'
      },
      {
        id: 'valuation-methods', title: 'Valuation Methods', sub: 'DCF, multiples, comparables, sum-of-parts',
        phase: 'Fundamentals', diff: 4,
        summary: 'Valuation determines whether a stock is cheap or expensive relative to its intrinsic value. Multiple methods give different perspectives — no single method is definitive, but confluence across methods is powerful.',
        concepts: ['P/E ratio: price relative to earnings — growth vs value considerations','Forward P/E vs trailing P/E','PEG ratio: P/E divided by growth rate','P/S ratio: useful for unprofitable growth companies','P/B ratio: net asset value metric','EV/EBITDA: enterprise value multiple — capital structure neutral','EV/Revenue: for high-growth pre-profit companies','DCF (Discounted Cash Flow): intrinsic value model','Terminal value in DCF: the dominant assumption','Discount rate (WACC): reflects risk of business','Sum-of-parts valuation: conglomerates and holding companies','Comparable company analysis: peer group multiples'],
        resources: [{type:'Book',name:'The Little Book of Valuation — Aswath Damodaran'},{type:'Course',name:'Damodaran Online: Valuation (free NYU course)'},{type:'Tool',name:'Koyfin / Tikr for comps and financial modeling'}],
        tip: 'Damodaran\'s free NYU course on valuation is the best free resource in finance. Watch the entire series before building a single DCF.'
      },
      {
        id: 'earnings-analysis', title: 'Earnings Analysis', sub: 'EPS beats, guidance, whisper numbers, reactions',
        phase: 'Fundamentals', diff: 3,
        summary: 'Earnings releases are the most recurring catalyst in equity trading. Understanding how to analyze, trade, and position around earnings is essential for equity traders.',
        concepts: ['EPS vs revenue beat/miss: which matters more','Guidance: forward-looking statements vs analyst consensus','Whisper numbers: unspoken expectations above official consensus','Buy the rumor, sell the news: earnings run-up and fade','Earnings surprise and post-announcement drift','IV crush in options after earnings: volatility collapse','Earnings calendar: planning your watchlist','Same-store sales, user growth, gross margin trends','Conference call analysis: tone, guidance, Q&A','Transcript reading: forward-looking language analysis','Comparing actual to previous quarter (QoQ) and same quarter prior year (YoY)','Sector earnings correlation: when MSFT beats, what else moves?'],
        resources: [{type:'Tool',name:'Earnings Whispers — earningswhispers.com'},{type:'Tool',name:'EDGAR: SEC Filings — 10-K, 10-Q access'},{type:'Video',name:'How to Trade Earnings — SMB Capital'}],
        tip: 'The quality of earnings matters more than the headline number. A beat from tax tricks or one-time items is very different from an operational beat with margin expansion.'
      },
      {
        id: 'sector-analysis', title: 'Sector & Industry Analysis', sub: 'GICS sectors, competitive moats, secular trends',
        phase: 'Fundamentals', diff: 3,
        summary: 'Stocks rarely move independently of their sector or industry. Understanding sector dynamics, competitive positioning, and macro tailwinds/headwinds adds another layer to fundamental analysis.',
        concepts: ['GICS (Global Industry Classification Standard): 11 sectors','Sector ETFs as benchmarks: XLK, XLF, XLV, XLE, etc.','Industry vs sector: semiconductor vs technology','Porter\'s Five Forces: competitive intensity framework','Economic moats: network effects, switching costs, cost advantages, intangibles','Secular vs cyclical trends in industries','Supply chain analysis: upstream and downstream dynamics','Total Addressable Market (TAM) estimation','Competitive positioning: market share trends','Management quality: insider ownership, track record, compensation','Regulatory environment: sector-specific risk','ESG considerations and their growing impact'],
        resources: [{type:'Book',name:'Competitive Strategy — Michael Porter'},{type:'Book',name:'The Little Book That Builds Wealth — Pat Dorsey'},{type:'Tool',name:'Finviz Sector Heatmap'},{type:'Video',name:'Understanding Economic Moats — Morning Star'}],
        tip: 'Research the industry before the company. A mediocre company in a great industry can be a 5x; a great company in a dying industry is still a value trap.'
      },
      {
        id: 'stock-screening', title: 'Stock Screening & Idea Generation', sub: 'Quantitative filters, qualitative catalysts',
        phase: 'Fundamentals', diff: 2,
        summary: 'With thousands of stocks to choose from, screening helps filter down to high-quality setups using quantitative criteria. The screen is the start of research, not the end.',
        concepts: ['Technical screens: price > 50-day MA, 52-week high list','Fundamental screens: EPS growth, revenue growth, margins','CANSLIM method: O\'Neil\'s 7 criteria for winning stocks','Earnings growth acceleration: key growth stock criteria','Revenue growth inflection: the catalyst for institutional interest','Insider buying screens: legal form 4 filings','Short interest: high short interest + catalyst = squeeze setup','Options flow screens: unusual call/put activity','IBD 50 and other curated growth stock lists','Relative strength ranking: RS line vs S&P 500','Momentum screens: 52-week high breakouts','Finding pre-earnings setups: building bases before reports'],
        resources: [{type:'Tool',name:'Finviz Elite — advanced screening'},{type:'Tool',name:'Trade Ideas — AI-driven scanner'},{type:'Tool',name:'IBD (Investor\'s Business Daily) — CANSLIM system'},{type:'Book',name:'How to Make Money in Stocks — William O\'Neil'}],
        tip: 'Don\'t fall in love with your screen results. A stock passing 7 criteria is a starting point for due diligence, not a trade signal.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 9: FUNDAMENTAL ANALYSIS — MACRO
  // ─────────────────────────────────────────────
  {
    id: 'p9', label: 'Phase 9 — Fundamental Analysis: Macro', num: '09', est: '3–4 weeks',
    color: '#5a3ec8', light: '#ede9fe', bg: 'rgba(90,62,200,0.09)', check: '#5a3ec8',
    nodes: [
      {
        id: 'macroeconomics', title: 'Macroeconomics for Traders', sub: 'GDP, inflation, employment, growth cycles',
        phase: 'Macro', diff: 3,
        summary: 'Macro is the backdrop against which all markets trade. Understanding the economic environment helps you know whether to lean long or short, which sectors to favor, and when to reduce overall exposure.',
        concepts: ['GDP: measuring economic output and growth','Leading vs lagging economic indicators','The business cycle: expansion, peak, contraction, trough','Inflation: CPI, PCE, producer price index (PPI)','Deflation and stagflation: the dangerous scenarios','Employment: unemployment rate, payrolls, wage growth','Consumption vs investment vs government spending','Trade balance and current account','How GDP growth affects corporate earnings','Recession indicators: inverted yield curve, LEI decline','Global macro: US vs EU vs EM divergences','Macro regime: which assets perform in each phase'],
        resources: [{type:'Book',name:'Economics — Paul Samuelson'},{type:'Video',name:'How the Economic Machine Works — Ray Dalio (30 min)'},{type:'Tool',name:'FRED (Federal Reserve Economic Data) — fred.stlouisfed.org'},{type:'Video',name:'Macro Mondays — Real Vision YouTube'}],
        tip: 'You don\'t need to be an economist to trade macro. Focus on the rate of change: is the economy getting better or worse, and how fast?'
      },
      {
        id: 'central-banks', title: 'Central Banks & Monetary Policy', sub: 'Fed, ECB, BOJ, rate cycles, QE, QT',
        phase: 'Macro', diff: 4,
        summary: 'Central banks are the most powerful force in financial markets. Fed decisions on rates and liquidity can override any technical setup. Understanding the policy cycle is non-negotiable for traders.',
        concepts: ['Federal Reserve: mandate (dual mandate), FOMC structure','Fed Funds Rate: the benchmark rate and its market impact','Taylor Rule: the formula for rate decisions','Forward guidance: how the Fed communicates future policy','Dot plot: FOMC member rate projections','Quantitative Easing (QE): asset purchases to expand money supply','Quantitative Tightening (QT): balance sheet reduction','Fed balance sheet as a liquidity indicator','European Central Bank (ECB) and Euro area differences','Bank of Japan (BOJ): YCC, negative rates, global carry trade','Bank of England (BOE), PBOC, RBA — global policy context','Rate differential impact on FX carry trades'],
        resources: [{type:'Video',name:'Fed Explained — YouTube (multiple)'},{type:'Tool',name:'CME FedWatch Tool — fed funds futures probability'},{type:'Book',name:'The Fed and Lehman Brothers — Lawrence Ball'},{type:'Website',name:'federalreserve.gov — speeches, minutes, dot plot'}],
        tip: 'Never fight the Fed. In a rate hiking cycle, long-duration growth stocks face structural headwinds. In a cutting cycle, they get structural tailwinds.'
      },
      {
        id: 'economic-indicators', title: 'Economic Indicators & Event Trading', sub: 'NFP, CPI, FOMC, GDP, PMI',
        phase: 'Macro', diff: 3,
        summary: 'High-impact economic releases move markets sharply. Knowing what each indicator measures, when it releases, and how markets typically react allows you to position or hedge appropriately.',
        concepts: ['Non-Farm Payrolls (NFP): most market-moving monthly US data','CPI (Consumer Price Index): the inflation headline','Core CPI vs headline CPI: excluding food & energy','FOMC meetings: 8 per year, rate decisions and statements','Fed Chair press conferences: market reaction protocols','GDP advance, preliminary, final: three readings','PMI (Purchasing Managers Index): manufacturing and services','ISM Manufacturing and Services indices','Consumer Confidence and Sentiment indices','Retail Sales: consumption pulse','Housing data: starts, permits, existing home sales','Using an economic calendar: trading around events'],
        resources: [{type:'Tool',name:'ForexFactory.com — economic calendar'},{type:'Tool',name:'Investing.com — calendar with expectations'},{type:'Video',name:'How to Trade NFP — YouTube'},{type:'Website',name:'bls.gov — official BLS data releases'}],
        tip: 'It\'s not the absolute number that matters — it\'s the deviation from consensus expectations. A good NFP in a weak economy can still be bad if it missed expectations.'
      },
      {
        id: 'geopolitical-risk', title: 'Geopolitical Risk & Event-Driven Trading', sub: 'Wars, elections, sanctions, trade policy',
        phase: 'Macro', diff: 3,
        summary: 'Geopolitical events create sudden regime changes in markets. While unpredictable, their market impact follows recognizable patterns. Learning to position for tail risks and exploit post-event reactions is a valuable skill.',
        concepts: ['Safe haven flows: gold, USD, JPY, Treasuries during crisis','Risk-off trade: selling EM, commodities, high-beta stocks','Oil and energy response to Middle East / Russia tensions','Election trading: historical patterns and uncertainty premium','Currency impacts of trade wars and tariffs','Sanctions: asset freeze, dollar denial, commodity impact','Fed independence and political pressure risk','NATO and defense sector implications','Supply chain geopolitics: semiconductor and critical minerals','Country-specific risk: investing in frontier/EM markets','Tail risk hedging via options or gold during elevated tensions','Post-event resolution: "sell the fear, buy the resolution"'],
        resources: [{type:'Book',name:'The Geopolitics of Emotion — Dominique Moïsi'},{type:'Video',name:'Geopolitical Risk and Markets — Real Vision'},{type:'Newsletter',name:'GZERO Media — Ian Bremmer geopolitical analysis'}],
        tip: '"Buy the rumor, sell the news" also applies to geopolitical fear. Markets often bottom when fear peaks — before any resolution occurs.'
      },
      {
        id: 'sentiment-cot', title: 'Sentiment Analysis & COT Report', sub: 'Retail sentiment, options skew, COT positioning',
        phase: 'Macro', diff: 3,
        summary: 'Markets are driven by human psychology. Sentiment extremes — when everyone is bullish or bearish — are contrarian signals. The COT report shows how professional money is actually positioned.',
        concepts: ['AAII Bull-Bear Survey: retail investor sentiment','CNN Fear & Greed Index: multi-factor composite','Put/Call ratio: options market sentiment gauge','VIX term structure: fear in the near vs far','Short interest: bearish positioning metric','COT Report (Commitment of Traders): CFTC weekly release','Commercial hedgers (smart money) vs large speculators vs small','Extreme commercial long = potential bottom','Extreme spec long = potential top (positioning reversal)','Futures positioning as macro sentiment gauge','Social media sentiment: unusual whales, StockTwits','Survey data limitations and contrarian applications'],
        resources: [{type:'Tool',name:'BarChart COT Charts — barchart.com'},{type:'Tool',name:'CNN Fear & Greed Index'},{type:'Video',name:'How to Read the COT Report — YouTube'},{type:'Tool',name:'Sentimentrader.com — professional sentiment aggregator'}],
        tip: 'When commercial hedgers are near record longs and large speculators are near record shorts (or vice versa), take note — this has historically preceded major trend reversals.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 10: RISK MANAGEMENT
  // ─────────────────────────────────────────────
  {
    id: 'p10', label: 'Phase 10 — Risk Management', num: '10', est: '3–4 weeks',
    color: '#b84a2a', light: '#fee2d4', bg: 'rgba(184,74,42,0.12)', check: '#b84a2a',
    nodes: [
      {
        id: 'position-sizing', title: 'Position Sizing Systems', sub: 'Fixed fractional, Kelly, volatility-based, optimal f',
        phase: 'Risk Mgmt', diff: 3,
        summary: 'Position sizing is the single most important mechanical variable in trading. Getting it right is the difference between surviving drawdowns and blowing up your account.',
        concepts: ['The 1% rule: risk no more than 1% of capital per trade','Fixed fractional: fixed % of account per trade','Fixed dollar risk: simpler, less dynamic','Kelly Criterion: mathematically optimal sizing given edge','Half-Kelly: practical Kelly to reduce variance','Volatility-based sizing: ATR determines shares/lots','R-based sizing: sizing to exact dollar risk','Scaling in: averaging into a winning position','Scaling out: partial exits at targets','Anti-martingale: increase size after wins, reduce after losses','Martingale: dangerous doubling strategy (avoid)','Maximum allocation per position and per sector'],
        resources: [{type:'Book',name:'The Mathematics of Money Management — Ralph Vince'},{type:'Book',name:'Trade Your Way to Financial Freedom — Van Tharp'},{type:'Video',name:'Position Sizing Explained — Trading Edge YouTube'},{type:'Article',name:'Investopedia: Kelly Criterion'}],
        tip: 'Even a 70% win rate can blow up an account with oversized positions. A 40% win rate with 3:1 R/R is highly profitable with correct sizing. Sizing matters more than accuracy.'
      },
      {
        id: 'stop-loss-mastery', title: 'Stop Loss Mastery', sub: 'Structure-based, ATR, time stops, mental vs hard',
        phase: 'Risk Mgmt', diff: 3,
        summary: 'Stops are your risk control mechanism. Where you place them determines your position size, your R/R, and ultimately your survival. Most traders either set them too tight (noise) or too wide (too much loss).',
        concepts: ['The purpose of stops: preserve capital, not predict reversals','Structure-based stops: below support, above resistance','ATR-based stops: 1–2x ATR from entry','Volatility-adjusted stops: wider in volatile markets','Time stops: exit if price hasn\'t moved in X days','Mental stops: the discipline problem and why hard stops win','Hard stops: always in the market, no discretion','Trailing stops: how to build a dynamic exit','Stop placement relative to obvious levels: give price room','The stop hunt: institutional price clearing before real move','Stop vs stop-limit: execution risk in fast markets','Managing stops during the trade: lock in partial profit'],
        resources: [{type:'Book',name:'Come Into My Trading Room — Alexander Elder'},{type:'Video',name:'Stop Loss Placement Guide — Warrior Trading'},{type:'Article',name:'The Definitive Guide to Stop Losses — TradingView'}],
        tip: 'If you feel anxious watching a trade, your stop is probably too far away or your position too large. The right size lets you think clearly.'
      },
      {
        id: 'risk-reward-expectancy', title: 'R/R Ratios & Expectancy', sub: 'Expected value, win rate, payout ratio',
        phase: 'Risk Mgmt', diff: 2,
        summary: 'Expectancy is the mathematical edge of a trading system. It combines win rate and average win/loss ratio to tell you whether your strategy makes money over time — regardless of individual trade outcomes.',
        concepts: ['Risk/Reward Ratio (R/R): reward per unit of risk','Minimum viable R/R: usually 1.5:1 to 2:1+','Expectancy formula: (Win% × Avg Win) − (Loss% × Avg Loss)','Positive expectancy: any positive number = edge exists','Win rate required for each R/R to be profitable','The math: 40% win rate at 2:1 R/R = positive expectancy','R-multiple: standardizing trades in units of risk','R-multiple distribution: what a good system looks like','System quality number (SQN): Van Tharp\'s metric','The relationship between frequency and magnitude','High win rate systems vs high R/R systems','Transaction costs and their impact on expectancy'],
        resources: [{type:'Book',name:'Trade Your Way to Financial Freedom — Van Tharp'},{type:'Article',name:'Expectancy Calculator — multiple sources'},{type:'Video',name:'Trading Edge and Expectancy — YouTube'}],
        tip: 'Calculate your real expectancy after 50+ trades. Most traders are shocked to find they have negative expectancy despite feeling like they know what they\'re doing.'
      },
      {
        id: 'drawdown-management', title: 'Drawdown Management & Recovery', sub: 'Max drawdown, psychology of losses, circuit breakers',
        phase: 'Risk Mgmt', diff: 3,
        summary: 'Drawdowns are inevitable. The question is not if you\'ll have them, but how deep they go and how you respond. Having a pre-written drawdown response plan before you need it is essential.',
        concepts: ['Max drawdown: peak-to-trough capital decline','Drawdown recovery math: -25% needs +33%, -50% needs +100%','Average drawdown vs maximum drawdown','Drawdown duration: how long recovery takes','Consecutive loss streaks: statistical inevitability','Daily loss limits: stop trading when X% down in a day','Weekly loss limits: reduce size after 2 consecutive losing weeks','The revenge trading trap: emotional response to losses','Reducing position size during drawdown: survival mode','Taking a break: the mental reset protocol','Analyzing drawdown: process failure vs statistical variance','Stress testing your system: expected worst-case scenario'],
        resources: [{type:'Book',name:'The Disciplined Trader — Mark Douglas'},{type:'Video',name:'How to Handle Drawdowns — SMB Capital'},{type:'Article',name:'Drawdown Management Framework — TradingView blog'}],
        tip: 'Build your drawdown rules when you\'re profitable and clear-headed. If you wait until you\'re in a drawdown to create rules, emotions will override logic every time.'
      },
      {
        id: 'portfolio-risk', title: 'Portfolio-Level Risk', sub: 'Correlation, concentration, beta, hedging',
        phase: 'Risk Mgmt', diff: 4,
        summary: 'Individual trade risk management is necessary but not sufficient. Portfolio-level risk considers how all your positions interact — correlated positions can magnify losses beyond what individual stops suggest.',
        concepts: ['Correlation: positions moving together amplify portfolio risk','Sector concentration risk: all tech stocks behave similarly','Beta: sensitivity of a position to market movement','Portfolio beta: aggregate market exposure','Gross exposure vs net exposure (long/short portfolios)','Diversification by sector, market cap, and timeframe','Maximum total portfolio drawdown vs individual trade rules','Hedge positions: SPX puts, VIX calls, inverse ETFs','Cross-asset hedging: short sector vs long individual stock','Leverage: gross notional vs net exposure','Scenario analysis: what happens in a 10% market crash?','Tail risk: low probability, high severity events'],
        resources: [{type:'Book',name:'Against the Gods: The Remarkable Story of Risk — Peter Bernstein'},{type:'Course',name:'CFA: Portfolio Management section'},{type:'Video',name:'Portfolio Risk Management — Real Vision'}],
        tip: 'During market corrections, correlations between stocks and sectors spike toward 1. Your diversification benefit disappears exactly when you need it most. Build tail hedges.'
      },
      {
        id: 'risk-frameworks', title: 'Risk Frameworks & Metrics', sub: 'Sharpe, Sortino, VaR, R-multiples, SQN',
        phase: 'Risk Mgmt', diff: 4,
        summary: 'Quantitative risk metrics allow you to objectively measure and compare trading systems. They replace gut feel with mathematics and let you communicate your edge to potential investors or prop firms.',
        concepts: ['Sharpe Ratio: excess return per unit of total volatility','Sortino Ratio: excess return per unit of downside volatility (better metric)','Calmar Ratio: annual return divided by max drawdown','R-multiples: standardizing outcomes in risk units','Profit factor: gross wins / gross losses','Maximum Adverse Excursion (MAE): stop placement optimization','Maximum Favorable Excursion (MFE): target optimization','System Quality Number (SQN): Van Tharp\'s composite','Value at Risk (VaR): probability-based loss estimate','Conditional VaR (CVaR): expected loss beyond VaR','Monte Carlo simulation: testing system robustness','Benchmarking: return per unit of risk vs buy-and-hold'],
        resources: [{type:'Book',name:'Quantitative Trading — Ernest Chan'},{type:'Article',name:'Sharpe vs Sortino: Which to Use — Investopedia'},{type:'Tool',name:'Edgewonk: trade journal with built-in metrics'}],
        tip: 'Aim for a Sortino Ratio above 1.5 and a Calmar Ratio above 1.0. These are rough professional-grade benchmarks for systematic strategies.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 11: TRADING PSYCHOLOGY
  // ─────────────────────────────────────────────
  {
    id: 'p11', label: 'Phase 11 — Trading Psychology', num: '11', est: '3–4 weeks',
    color: '#c07a10', light: '#fef3c7', bg: 'rgba(192,122,16,0.12)', check: '#c07a10',
    nodes: [
      {
        id: 'emotional-cycle', title: 'The Emotional Cycle of Trading', sub: 'Fear, greed, hope, regret — the emotional rollercoaster',
        phase: 'Psychology', diff: 2,
        summary: 'The emotional cycle follows the market cycle. Understanding exactly which emotional state you\'re in during different phases of a trade allows you to recognize and interrupt destructive emotional patterns.',
        concepts: ['Fear of missing out (FOMO): chasing late entries','Fear of loss: cutting winners too early, holding losers','Greed: overleveraging after a win streak','Revenge trading: trying to recover losses immediately','Hope: refusing to cut a losing trade','Regret: second-guessing and over-analyzing after exits','Overconfidence after winning streaks','The thrill of trading: dopamine and addiction patterns','Emotional contagion: absorbing market panic or euphoria','Loss aversion: losses feel 2x bigger than gains','The disposition effect: selling winners, holding losers','Recognizing your personal emotional triggers'],
        resources: [{type:'Book',name:'Trading in the Zone — Mark Douglas'},{type:'Book',name:'The Psychology of Trading — Brett Steenbarger'},{type:'Video',name:'Emotional Intelligence for Traders — YouTube'}],
        tip: 'Before placing a trade, rate your emotional state 1-10. If you\'re above a 7 in excitement or below a 3 in calmness, step away from the platform.'
      },
      {
        id: 'cognitive-biases', title: 'Cognitive Biases in Trading', sub: 'Anchoring, confirmation bias, recency, gambler\'s fallacy',
        phase: 'Psychology', diff: 3,
        summary: 'Cognitive biases are systematic errors in thinking that evolved for survival but destroy trading performance. Knowing them doesn\'t automatically fix them, but it\'s the required first step.',
        concepts: ['Confirmation bias: seeking evidence that confirms existing view','Anchoring: fixating on a specific price as reference point','Recency bias: overweighting recent events vs base rates','Representativeness: pattern-matching to familiar past events','Gambler\'s fallacy: believing past losses predict future wins','Sunk cost fallacy: staying in bad trades because of what you\'ve lost','Hindsight bias: "I knew it all along" distorts learning','Overconfidence bias: overestimating skill, underestimating luck','Status quo bias: inertia, preference for the default choice','Attribution bias: success = skill, failure = bad luck','Availability heuristic: vivid memories bias decisions','Narrative fallacy: constructing causal stories from random data'],
        resources: [{type:'Book',name:'Thinking, Fast and Slow — Daniel Kahneman'},{type:'Book',name:'Misbehaving — Richard Thaler'},{type:'Book',name:'Your Money and Your Brain — Jason Zweig'}],
        tip: 'Keep a "bias log" alongside your trade journal. Note which bias you suspect influenced each poor decision. Patterns will emerge that show your specific psychological vulnerabilities.'
      },
      {
        id: 'discipline-consistency', title: 'Discipline, Consistency & Process', sub: 'Rules-based thinking, process over outcome',
        phase: 'Psychology', diff: 3,
        summary: 'Discipline is following your rules when every emotion tells you not to. Consistency is doing it trade after trade. Process-focus means judging trades by how well you followed your plan — not by outcome.',
        concepts: ['Process vs outcome: a losing trade can be a perfect trade','Following rules under live P&L pressure','Pre-trade checklist: systematic approach to every entry','The checklist manifesto applied to trading','Developing automatic execution: habit formation','Breaking rules consciously: when and why it\'s justified','Rules hierarchy: non-negotiable vs flexible rules','Accountability systems: partner, mentor, or public commitment','Identity-based trading: "I am a disciplined trader"','Building habits: small consistent actions compound','The role of boredom: disciplined trading is not exciting','Emotional detachment: neither celebrating wins nor mourning losses'],
        resources: [{type:'Book',name:'Atomic Habits — James Clear'},{type:'Book',name:'The Checklist Manifesto — Atul Gawande'},{type:'Book',name:'Mindset — Carol Dweck'}],
        tip: 'Commit to 100 trades with strict rule-following before evaluating your system. Any fewer and you don\'t have statistical significance — you have noise.'
      },
      {
        id: 'trade-journaling', title: 'Trade Journaling: The Compounding Habit', sub: 'What to track, how to review, pattern spotting',
        phase: 'Psychology', diff: 2,
        summary: 'A trade journal is the most powerful improvement tool available to any trader. Without it, you repeat the same mistakes indefinitely. With it, you build compound learning.',
        concepts: ['What to record: entry, exit, size, setup type, rationale','Screenshots: capture the chart at entry and exit','Emotional state at entry and exit','Post-trade analysis: what went right/wrong','Weekly review: look for patterns across trades','Monthly review: system-level metrics','Tagging trades by setup type for filtering','Identifying your A+ setups vs B/C setups','MAE and MFE analysis from journal data','Time-of-day analysis: when do you perform best?','Journal software vs spreadsheet vs handwritten','Combining journal with recorded screen playback'],
        resources: [{type:'Tool',name:'Edgewonk — comprehensive trade journal'},{type:'Tool',name:'TradesViz — free, powerful analysis'},{type:'Tool',name:'Tradervue — alternative with broker import'},{type:'Book',name:'The Daily Trading Coach — Brett Steenbarger'}],
        tip: 'The review is more important than the recording. Schedule a fixed weekly review session. Most traders record but never deeply analyze.'
      },
      {
        id: 'peak-performance', title: 'Peak Performance & Trader Routine', sub: 'Morning routines, energy management, flow state',
        phase: 'Psychology', diff: 2,
        summary: 'Trading performance is a function of mental state. Building routines that optimize focus, energy, and emotional regulation consistently — not just occasionally — is what separates elite traders from average ones.',
        concepts: ['Morning routine: physical, mental, and market prep','Pre-market preparation: news, levels, watchlist','Physical health: sleep, exercise, nutrition as trading variables','Mindfulness and meditation: reducing reactivity','Breathing techniques for in-trade stress management','Flow state: optimal arousal for peak performance','Post-market review: close loops before the next day','Weekly planning: macro themes for the week ahead','Vacation and mental recovery: deliberate disconnection','Journaling for mental clarity (not just trade journaling)','Managing screens: preventing dopamine overwhelm','Building a trader\'s schedule: deep work blocks'],
        resources: [{type:'Book',name:'The Daily Trading Coach — Brett Steenbarger'},{type:'Book',name:'Peak Performance: Mindset Tools for Athletes and Traders'},{type:'App',name:'Headspace / Calm — mindfulness for traders'}],
        tip: 'Track your P&L by time of day and day of week. Most traders have specific sessions where they consistently lose. Identifying and avoiding these windows is immediate edge improvement.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 12: TRADING STYLES DEEP DIVE
  // ─────────────────────────────────────────────
  {
    id: 'p12', label: 'Phase 12 — Trading Styles Deep Dive', num: '12', est: '4–6 weeks',
    color: '#2a7a50', light: '#d1fae5', bg: 'rgba(42,122,80,0.09)', check: '#2a7a50',
    nodes: [
      {
        id: 'scalping-deep', title: 'Scalping', sub: 'Execution edge, tick data, high frequency, rebates',
        phase: 'Styles', diff: 4,
        summary: 'Scalping involves capturing very small price moves many times per day. It requires exceptional execution, a statistical edge on the spread or microstructure, and discipline to cut losses instantly.',
        concepts: ['Scalping mechanics: profit per trade is $0.05–$0.30','Volume requirement: need liquid instruments, tight spread','Execution speed: direct market access (DMA) critical','Rebate trading: make/take fee structures on exchanges','Scalping setups: opening range, VWAP reversion, breakout scalp','Risk per trade: often 1:1 or less — high win rate required','Tools: hot keys for instant entry/exit (no clicking)','L2 and tape integration for timing','Mental demands: hundreds of decisions per day','Session focus: first 30 minutes and last 30 minutes','P&L per share vs per trade math','Scaling: size matters much more than in other styles'],
        resources: [{type:'Book',name:'The Scalper\'s Guide to the Market — various'},{type:'Video',name:'Scalping for Beginners — Investors Underground'},{type:'Course',name:'Warrior Trading: Momentum Day Trading Course'}],
        tip: 'Scalping looks easy but has the highest failure rate. Before scalping live, develop your execution on paper for at least 2 months and achieve consistent profitability there first.'
      },
      {
        id: 'day-trading-deep', title: 'Day Trading', sub: 'Gap strategies, momentum, news plays, intraday setups',
        phase: 'Styles', diff: 3,
        summary: 'Day trading is the most accessible active style. Positions are opened and closed intraday, eliminating overnight gap risk. Success requires a structured playbook of setups, strict risk rules, and consistency.',
        concepts: ['Pre-market preparation: gap scanner, news, sector context','Gap and go: momentum continuation on high relative volume','Gap fade: overextended gap reverting to prior close','Opening range breakout (ORB): 5m, 15m, 30m ORB','VWAP reclaim and VWAP rejection setups','Intraday trend following with pullback entries','News catalyst trades: FDA, earnings, M&A reactions','Midday doldrums: volume evaporates 11am–2pm (ET)','Power hour: 3–4pm volume surge, trend continuation or reversal','PDT rule management: 3 day trades per week for <$25K','Intraday sector correlation: follow the leader','EOD trade management: close all vs hold overnight decisions'],
        resources: [{type:'Book',name:'How to Day Trade for a Living — Andrew Aziz'},{type:'Course',name:'Warrior Trading — Day Trading Course'},{type:'Video',name:'Day Trading Blueprint — SMB Capital'}],
        tip: 'The opening 30 minutes and the closing 30 minutes contain 60%+ of intraday volatility. If you can only trade 2 windows, those are the ones.'
      },
      {
        id: 'swing-trading-deep', title: 'Swing Trading', sub: 'Weekly setups, entry triggers, holding 2–10 days',
        phase: 'Styles', diff: 3,
        summary: 'Swing trading captures multi-day to multi-week moves. It is the most compatible style with a full-time job, requiring only 30–60 minutes per day to manage. Success depends on identifying high-quality setups and managing overnight risk.',
        concepts: ['Using weekly chart for bias, daily for entry','Base building: tight consolidation before breakout','Earnings proximity: trading around reports vs avoiding them','Entry triggers: breakout above resistance, pullback to EMA','The 3-day rule: many setups resolve in 1–3 days','Momentum swing trading vs mean reversion swing','Position sizing for overnight gap risk','Using options for defined-risk swing trades','Stop placement: below base or 8-day EMA','Target: measured move from pattern, extension levels','Portfolio of swings: 3–8 positions simultaneously','Weekly watchlist preparation: Sunday evening ritual'],
        resources: [{type:'Book',name:'Swing Trading Simplified — Larry Swing'},{type:'Course',name:'IBD Investors Business Daily: Swing Trading course'},{type:'Video',name:'Swing Trading Strategy — Rayner Teo YouTube'}],
        tip: 'The best swing trades are obvious. If you need to explain it in more than two sentences, the setup isn\'t clear enough. Wait for clarity.'
      },
      {
        id: 'position-trading-deep', title: 'Position Trading & Trend Following', sub: 'Monthly charts, macro trends, commodity trend systems',
        phase: 'Styles', diff: 3,
        summary: 'Position trading holds for weeks to months, riding macro trends. It requires the patience to endure large swings, the wisdom to let winners run, and a macro framework to identify the right environment.',
        concepts: ['Weekly and monthly chart analysis as primary timeframe','Trend identification using 50/200 moving averages','Breakout of multi-month or multi-year bases','The 52-week high breakout strategy: O\'Neil / Minervini','Sector rotation as position trading framework','CTA (Commodity Trading Advisor) trend-following systems','Breakout and hold: fighting the urge to take small profits','Drawdown tolerance: 20–30% in a single position is possible','Using options to define risk on long-term positions','Macro overlay: are conditions right for this trend?','Risk management: 5–10 positions maximum for diversification','Concentration vs diversification tradeoffs'],
        resources: [{type:'Book',name:'How to Make Money in Stocks — William O\'Neil'},{type:'Book',name:'Trend Following — Michael Covel'},{type:'Book',name:'Trade Like a Stock Market Wizard — Mark Minervini'}],
        tip: 'Position trading has the best return per hour of work but requires the most psychological endurance. You will see large open losses on the way to large gains.'
      },
      {
        id: 'news-catalyst-trading', title: 'News & Catalyst Trading', sub: 'FDA, M&A, earnings, upgrades, short squeezes',
        phase: 'Styles', diff: 3,
        summary: 'Catalyst trading exploits the repricing of assets following unexpected or high-impact news. The edge comes from rapid assessment of the catalyst\'s significance and beating the slower-moving crowd.',
        concepts: ['Types of catalysts: FDA approval/rejection, M&A, earnings, guidance','Pre-catalyst positioning: anticipating vs reacting','Initial move vs sustained move: can you tell the difference?','Momentum continuation after large catalyst gaps','Fading overreaction: when first move is too much','Short squeeze setups: high short interest + catalyst = explosion','Options flow before catalyst: unusual activity as signal','Same-sector sympathy plays: one stock moves, sector follows','FDA calendar: PDUFA dates, complete response letters','M&A arbitrage: buying target, shorting acquirer','Management changes and their impact on stock direction','Biotech catalyst trading: binary events with defined outcomes'],
        resources: [{type:'Tool',name:'Benzinga Pro — real-time news feed'},{type:'Tool',name:'Briefing.com — news catalyst platform'},{type:'Video',name:'Trading News Catalysts — SMB Capital'},{type:'Tool',name:'FDA Calendar — drugs@fda.gov'}],
        tip: 'Read the actual press release before you trade, not just the headline. The detail is where the real opportunity or trap often lies.'
      },
      {
        id: 'earnings-trading', title: 'Earnings Trading Strategies', sub: 'Straddles, pre-earnings momentum, post-earnings drift',
        phase: 'Styles', diff: 4,
        summary: 'Earnings releases are the highest-impact recurring catalyst in equity markets. Multiple strategies exist — each with distinct risk profiles, timing requirements, and return characteristics.',
        concepts: ['IV expansion into earnings: how implied vol rises before reports','IV crush after earnings: regardless of direction, IV collapses','Straddle strategy: buy both calls and puts, profit from large move','Strangle: wider wings, cheaper, needs bigger move','The earnings run-up: stocks often rally into reports','Fading the earnings run: sell before report, rebuy after IV crush','Post-earnings drift (PEAD): beaten stocks often drift further','Earnings beat with guidance cut: sell-the-news setup','Miss with guidance raise: buy-the-dip setup','Selecting options expiry: weekly vs monthly for earnings','Pre-earnings risk: using defined-risk options','Finding best earnings trades: IV rank, historical move analysis'],
        resources: [{type:'Tool',name:'Earnings Whispers — earningswhispers.com'},{type:'Tool',name:'Market Chameleon — IV rank and expected move'},{type:'Video',name:'Trading Earnings with Options — Tastytrade'},{type:'Tool',name:'OptionStrat — options strategy visualizer'}],
        tip: 'Compare the options-implied move to the stock\'s historical average move before earnings. If the options are pricing 8% but historical average is 5%, selling premium has mathematical edge.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 13: MARKETS DEEP DIVE
  // ─────────────────────────────────────────────
  {
    id: 'p13', label: 'Phase 13 — Markets Deep Dive', num: '13', est: '3–4 weeks',
    color: '#1d6fa4', light: '#dbeafe', bg: 'rgba(29,111,164,0.09)', check: '#1d6fa4',
    nodes: [
      {
        id: 'us-equities', title: 'US Equities Deep Dive', sub: 'NYSE, NASDAQ, small caps, IPOs, SPACs',
        phase: 'Markets', diff: 3,
        summary: 'US equities are the deepest and most liquid market in the world. Understanding their unique characteristics, participant base, and structural dynamics is essential for equity traders.',
        concepts: ['NYSE vs NASDAQ: auction specialist vs electronic market maker','Market cap tiers: mega cap, large cap, mid cap, small cap, micro cap','Small cap liquidity risk: wider spreads, harder to exit','S&P 500 index mechanics: float-adjusted market cap weighting','Russell 2000: the small cap benchmark','Index rebalancing: predictable forced buying/selling','IPO process: S-1 filing, roadshow, first-day dynamics','SPAC mechanics: blank check company, target announcement','Secondary offerings: dilutive, watch for discounts','Lock-up expiration: insider selling pressure after IPO','Short selling in US equities: borrow mechanics','Pre-market and after-hours: ECN-based trading'],
        resources: [{type:'Book',name:'Market Wizards — Jack Schwager'},{type:'Tool',name:'EDGAR: SEC Filings'},{type:'Video',name:'US Equity Market Structure — Patrick Boyle'},{type:'Book',name:'How to Make Money in Stocks — O\'Neil'}],
        tip: 'The most money in equities is made by identifying institutional accumulation in the base-building phase (Stage 1) and riding the Stage 2 markup. Everything else is noise.'
      },
      {
        id: 'forex-deep', title: 'Forex & Currency Markets', sub: 'Pairs, sessions, carry trade, FX positioning',
        phase: 'Markets', diff: 3,
        summary: 'The forex market is the largest and most liquid financial market in the world, trading $7+ trillion daily. Its unique structure — decentralized, 24/5, leverage-driven — creates both opportunities and traps.',
        concepts: ['Major pairs: EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD','Cross pairs: EUR/GBP, GBP/JPY, EUR/JPY','Exotic pairs: USD/TRY, USD/ZAR — high spread, high volatility','Pip, lot, and position size calculation','Leverage in forex: 50:1 retail (US), 200:1 offshore — danger','Spread and swap costs: the hidden cost of forex','Three sessions: Asian (quiet), London (volatile), New York (overlap)','London/New York overlap: highest liquidity window','The carry trade: borrow low-yield, invest high-yield currency','Interest rate differential and its FX impact','FX intervention: central bank action in currency markets','Forward guidance impact on major currency pairs'],
        resources: [{type:'Book',name:'Trading Forex — Kathy Lien'},{type:'Website',name:'BabyPips.com — comprehensive free FX education'},{type:'Tool',name:'Oanda fxTrade — retail forex platform'},{type:'Tool',name:'Forex Factory — economic calendar & COT data'}],
        tip: 'Treat the carry trade like a business: earn the daily swap (positive carry) while setting technical stops. Small daily income + trend following = carry trade edge.'
      },
      {
        id: 'futures-deep', title: 'Futures Markets', sub: 'Equity index, commodities, rates, FX futures',
        phase: 'Markets', diff: 4,
        summary: 'Futures are standardized forward contracts traded on exchanges. They offer leverage, tax efficiency, and access to commodities and rates that equities cannot provide. Futures are the domain of professionals and well-capitalized traders.',
        concepts: ['Futures contract mechanics: size, tick value, expiry, settlement','Cash settlement vs physical delivery','Initial margin vs maintenance margin','SPAN margin: sophisticated futures margin system','Rolling contracts: closing near-month, opening next-month','Equity index futures: ES (S&P), NQ (NASDAQ), RTY (Russell)','Commodity futures: CL (crude oil), GC (gold), ZC (corn)','Rate futures: ZN (10yr T-note), ZB (30yr), FF (fed funds)','FX futures: 6E (EUR), 6J (JPY) vs spot forex','Contango vs backwardation: futures curve shape','Basis risk: difference between futures and spot price','Tax advantage: 60/40 rule — 60% long-term, 40% short-term'],
        resources: [{type:'Website',name:'CMEGroup.com — education hub for futures'},{type:'Book',name:'A Complete Guide to the Futures Market — Jack Schwager'},{type:'Course',name:'CME Group: Futures Fundamentals (free)'}],
        tip: 'The ES (S&P 500 futures) is the most important futures contract in the world. Even equity traders should watch it — it leads the open every day.'
      },
      {
        id: 'crypto-deep', title: 'Cryptocurrency Markets', sub: 'Spot, perps, DeFi, on-chain analytics, funding rates',
        phase: 'Markets', diff: 4,
        summary: 'Crypto is the newest and most volatile major market. It operates 24/7, is heavily retail-driven, and has unique mechanics (perpetual futures, on-chain data, funding rates) that create exploitable inefficiencies.',
        concepts: ['Bitcoin and Ethereum: the two dominant assets','Altcoins and their relationship to BTC dominance','Spot markets vs perpetual futures (perps)','Funding rate: the mechanism balancing perp price to spot','Long/short ratio and its sentiment implications','Liquidation levels: cascading forced selling and buying','On-chain analytics: exchange inflows/outflows, whale movements','HODL waves: LTH vs STH supply distribution','Stablecoin market cap as a capital reservoir','DeFi: DEX trading, liquidity pools, yield farming','CEX vs DEX trading mechanics','Regulatory risk and its crypto market impact','The halving cycle and its historical price relationship'],
        resources: [{type:'Tool',name:'Glassnode — on-chain analytics'},{type:'Tool',name:'CoinGlass — liquidation maps and funding rates'},{type:'Tool',name:'TradingView — crypto charting'},{type:'Website',name:'Messari.io — crypto research and data'}],
        tip: 'Funding rates above 0.1% per 8 hours (0.3%/day) signal extreme leverage. When funding is highly positive and price hasn\'t moved much, large longs are trapped — potential long squeeze setup.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 14: OPTIONS TRADING
  // ─────────────────────────────────────────────
  {
    id: 'p14', label: 'Phase 14 — Options Trading', num: '14', est: '4–6 weeks',
    color: '#6b42c8', light: '#ede9fe', bg: 'rgba(107,66,200,0.09)', check: '#6b42c8',
    nodes: [
      {
        id: 'options-fundamentals', title: 'Options Fundamentals', sub: 'Calls, puts, rights, obligations, expiry, ITM/OTM',
        phase: 'Options', diff: 3,
        summary: 'Options are contracts that give the buyer the right (but not obligation) to buy or sell at a specific price before expiration. Their asymmetric payoff profile makes them the most versatile instrument in trading.',
        concepts: ['Call option: right to buy at strike price','Put option: right to sell at strike price','Option buyer: pays premium, has right but no obligation','Option seller (writer): receives premium, has obligation','Strike price and its relationship to current stock price','Expiration date: weekly, monthly, LEAPS (2+ years)','ITM (In the Money): intrinsic value exists','ATM (At the Money): strike near current price','OTM (Out of the Money): no intrinsic value, only time value','Intrinsic value vs extrinsic (time) value','Options chain reading: strikes, bids, asks, OI, volume','Exercise and assignment: automatic exercise at expiry','American vs European style options'],
        resources: [{type:'Book',name:'Options as a Strategic Investment — Lawrence McMillan'},{type:'Course',name:'Tastytrade: Options Course (free)'},{type:'Video',name:'Options Explained — Options Alpha YouTube'},{type:'Tool',name:'OptionStrat.com — visual options builder'}],
        tip: 'Until you understand all five Greeks, don\'t sell naked options. The leverage and obligation involved requires full awareness of how the position will behave.'
      },
      {
        id: 'the-greeks', title: 'The Greeks: Delta, Gamma, Theta, Vega, Rho', sub: 'Risk sensitivities, second-order effects',
        phase: 'Options', diff: 4,
        summary: 'The Greeks measure how an option\'s price changes with respect to various factors. Mastering them transforms options from lottery tickets into precisely calibrated instruments for expressing a market view.',
        concepts: ['Delta: rate of change vs stock price (0 to 1 for calls, 0 to -1 for puts)','Delta as probability proxy: 0.30 delta ≈ 30% chance of expiring ITM','Gamma: rate of delta change — highest near ATM and expiry','Gamma risk: position changes character rapidly near expiry','Theta: time decay — how much premium erodes per day','Theta acceleration: fastest decay in final 30 days','Vega: sensitivity to implied volatility changes','Long vega benefits from IV expansion; short vega from contraction','Rho: sensitivity to interest rates (minor for most trades)','Charm: delta decay over time (second-order)','Vanna: delta change as IV changes (second-order)','Portfolio Greeks: aggregate your exposures across positions'],
        resources: [{type:'Book',name:'Option Volatility & Pricing — Sheldon Natenberg'},{type:'Video',name:'Greeks Explained — Tastytrade YouTube'},{type:'Tool',name:'Interactive Brokers risk graph for Greeks visualization'}],
        tip: 'Think of theta as your rent income (if you\'re selling options) or your rent cost (if you\'re buying). Positive theta = time is your ally; negative theta = time is your enemy.'
      },
      {
        id: 'implied-volatility', title: 'Implied Volatility & IV Rank', sub: 'IV percentile, term structure, skew, event pricing',
        phase: 'Options', diff: 4,
        summary: 'Implied Volatility (IV) is the market\'s consensus estimate of future price movement, derived from option prices. Trading IV — rather than just direction — is one of the most powerful edges in options.',
        concepts: ['Implied vs realized volatility: the premium traders pay','IV derived from option prices via Black-Scholes inverse','IV Rank (IVR): current IV relative to 52-week range','IV Percentile: % of days in past year with lower IV','High IVR = sell premium; low IVR = buy premium or spreads','VIX: the market\'s 30-day implied vol expectation for S&P','VIX term structure: front vs back month contango/backwardation','Volatility skew: OTM puts more expensive than calls (usually)','Sticky strike vs sticky delta skew behavior','Forward volatility: implied vol for specific future periods','Event-driven IV: earnings, FOMC, FDA dates inflate IV','IV crush: implied vol collapse after the event resolves'],
        resources: [{type:'Book',name:'Option Volatility & Pricing — Sheldon Natenberg'},{type:'Tool',name:'Market Chameleon — IV rank and percentile'},{type:'Video',name:'Implied Volatility Explained — Tastytrade'},{type:'Tool',name:'CBOE VIX methodology documentation'}],
        tip: 'IVR above 50% generally favors premium selling. IVR below 20% generally favors premium buying. This single filter improves options strategy selection dramatically.'
      },
      {
        id: 'buying-options', title: 'Buying Options: Directional & Volatility Plays', sub: 'Long calls, long puts, debit spreads, LEAPS',
        phase: 'Options', diff: 3,
        summary: 'Buying options provides defined risk and unlimited upside. The challenge is that time, IV crush, and direction all work against you simultaneously. Precise timing and setup selection are critical.',
        concepts: ['Long call: bullish directional play with defined risk','Long put: bearish directional play or portfolio hedge','Cost of being wrong: premium is the max loss','Time decay as primary enemy for option buyers','Buying ITM vs ATM vs OTM: tradeoffs explained','Using delta to choose strike (0.40–0.70 for directional)','DTE (Days to Expiration): longer DTE gives more time','Swing trade options: 30–60 DTE to avoid theta decay','Debit spread: reduce cost, cap both gain and loss','Bull call spread: long lower strike, short higher strike','Bear put spread: long higher strike, short lower strike','LEAPS: long-term options (1–2 year) as stock replacement'],
        resources: [{type:'Video',name:'How to Buy Options — SMB Capital'},{type:'Tool',name:'OptionStrat — spread visualizer'},{type:'Course',name:'Tastytrade: Buying Options strategy guide'}],
        tip: 'When buying options for a directional trade, buy at minimum 45 DTE. Options with less than 21 DTE lose value too fast to give your thesis time to work.'
      },
      {
        id: 'selling-options', title: 'Selling Options: Premium & Income Strategies', sub: 'Covered calls, cash-secured puts, naked puts',
        phase: 'Options', diff: 4,
        summary: 'Options sellers have statistical edge over buyers because of the volatility risk premium — implied vol systematically overstates actual realized vol. But selling options requires margin, carries undefined risk, and demands strict discipline.',
        concepts: ['The volatility risk premium: implied > realized over time','Theta decay as the seller\'s ally','Covered call: selling upside on owned stock for income','Cash-secured put: sell right to buy at lower price — premium income','Naked put: same as CSP but without the cash secured','Naked call: highest risk, unlimited theoretical loss','Credit received as max gain: probability edge','Managing trades: close at 50% of max profit, 21 DTE rule','Rolling: extending or adjusting a challenged position','Assignment risk: when to avoid it, how to manage it','Margin requirements for naked options','When to use premium selling: high IVR environments only'],
        resources: [{type:'Book',name:'The Tastytrade Manifesto — Tom Sosnoff'},{type:'Course',name:'Tastytrade: Selling Options mastery'},{type:'Video',name:'Selling Puts for Income — Tastytrade YouTube'}],
        tip: 'Never sell naked options on stocks you wouldn\'t want to own (puts) or that you can\'t cover (calls). Assignment happens and you must be prepared.'
      },
      {
        id: 'multi-leg-spreads', title: 'Multi-Leg Spreads & Complex Strategies', sub: 'Iron condor, butterfly, calendar, diagonal, ratio',
        phase: 'Options', diff: 5,
        summary: 'Multi-leg strategies combine multiple options into a single position that expresses a specific view on direction, volatility, or time. They enable traders to define risk, reduce cost, and profit in specific market scenarios.',
        concepts: ['Iron condor: sell OTM call + put, buy wings — profit in range','Iron butterfly: sell ATM straddle, buy wings — tighter range','Vertical spread: direction + defined risk','Calendar spread (horizontal): sell near-month, buy far-month — profits from time differential','Diagonal spread: different strikes + expiry','Ratio spread: selling more than buying — dangerous vol risk','Double diagonal: two diagonals, range-bound strategy','Broken wing butterfly: skew for a direction bias','Straddle: buy both call and put — big move needed','Strangle: buy OTM call and put — cheaper but needs bigger move','PMCC (Poor Man\'s Covered Call): LEAPS + short calls','Jade lizard: short put + bear call spread — no upside risk'],
        resources: [{type:'Book',name:'Options as a Strategic Investment — Lawrence McMillan'},{type:'Tool',name:'OptionStrat.com — multi-leg strategy builder'},{type:'Video',name:'Iron Condor Explained — Tastytrade'},{type:'Course',name:'Options Alpha: The Full Masterclass (free)'}],
        tip: 'The iron condor is the most popular retail options strategy — and widely misused. Only deploy it in high-IV environments (IVR > 50%) or the premium collected won\'t justify the risk.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 15: STRATEGY DEVELOPMENT & SYSTEMS
  // ─────────────────────────────────────────────
  {
    id: 'p15', label: 'Phase 15 — Strategy Development & Systems', num: '15', est: '4–6 weeks',
    color: '#2d8a6b', light: '#ccfbf1', bg: 'rgba(45,138,107,0.09)', check: '#2d8a6b',
    nodes: [
      {
        id: 'finding-edge', title: 'Defining & Quantifying Your Edge', sub: 'Setup inventory, hypothesis testing, conditions',
        phase: 'Systems', diff: 4,
        summary: 'An edge is a statistical advantage that, over many trades, results in positive expectancy. Finding and defining your edge is the highest-leverage work you can do as a trader.',
        concepts: ['What is an edge: positive expectancy over many occurrences','Edge sources: information, execution, psychological, structural','Setup inventory: documenting every valid entry scenario','Entry conditions: exact, objective, testable criteria','Exit conditions: mechanical, pre-defined','Market conditions: when does your edge work vs fail?','Time of day / day of week analysis','Market regime filter: trending vs ranging','Hypothesis testing: define, test, validate or reject','Sample size: minimum 30–100 trades for statistical significance','Edge decay: strategies stop working, must adapt','Finding your own edge vs copying someone else\'s'],
        resources: [{type:'Book',name:'Quantitative Trading — Ernest Chan'},{type:'Book',name:'The Art and Science of Technical Analysis — Adam Grimes'},{type:'Video',name:'How to Find Your Trading Edge — Rayner Teo'}],
        tip: 'If you can\'t write your entry and exit rules in a single paragraph with no ambiguity, you don\'t have a system — you have a general feeling. Fix that first.'
      },
      {
        id: 'backtesting', title: 'Backtesting: Methodology & Pitfalls', sub: 'Walk-forward testing, overfitting, survivorship bias',
        phase: 'Systems', diff: 4,
        summary: 'Backtesting validates whether a strategy has historically had positive expectancy. Done correctly, it builds confidence. Done incorrectly, it creates false confidence that gets traders killed in live markets.',
        concepts: ['Manual backtesting vs automated backtesting','How to manually backtest: chart replay, annotation','Automated backtesting: Python, TradingView Pine Script, Amibroker','Look-ahead bias: using future data in the backtest (destroys validity)','Survivorship bias: only testing stocks that still exist','Data snooping / curve fitting: overfitting to historical data','Walk-forward optimization: test parameters out-of-sample','Out-of-sample testing: keep 30% of data for validation','Monte Carlo simulation: randomizing trade order to stress test','Slippage and commission inclusion: making results realistic','Minimum sample size: 200+ trades for statistical confidence','Failing a backtest: failure is information, not defeat'],
        resources: [{type:'Book',name:'Evidence-Based Technical Analysis — David Aronson'},{type:'Book',name:'Building Algorithmic Trading Systems — Kevin Davey'},{type:'Tool',name:'TradingView Pine Script backtesting'},{type:'Tool',name:'Python: Backtrader / Zipline / VectorBT'}],
        tip: 'If your backtest results look too good, you\'ve probably overfit. A realistic system should show some losing streaks, drawdown periods, and imperfect results.'
      },
      {
        id: 'algo-trading', title: 'Quantitative & Algorithmic Trading', sub: 'Python, strategy automation, execution systems',
        phase: 'Systems', diff: 5,
        summary: 'Algorithmic trading uses code to execute systematic strategies. It removes emotion, improves consistency, and enables testing of ideas on years of data. The barrier to entry has never been lower.',
        concepts: ['Python for finance: pandas, numpy, matplotlib, scipy','Data sources: Yahoo Finance, Alpaca, Quandl, Polygon.io','Strategy coding: signals, position management, risk controls','Vectorized backtesting vs event-driven backtesting','Execution: broker APIs (IBKR, Alpaca, Interactive Brokers)','Live paper trading before deploying capital','Latency considerations: co-location vs retail API','Statistical arbitrage: pairs trading, cointegration','Mean reversion: RSI, Bollinger Band quantitative approaches','Trend following: moving average crossover systems','Machine learning in trading: classification, regression, NLP for sentiment','Walk-forward portfolio optimization'],
        resources: [{type:'Book',name:'Quantitative Trading — Ernest Chan'},{type:'Book',name:'Advances in Financial Machine Learning — Marcos Lopez de Prado'},{type:'Tool',name:'Alpaca Markets — commission-free trading API'},{type:'Course',name:'QuantConnect — algorithmic trading cloud platform'}],
        tip: 'Start with a simple momentum or mean reversion strategy that you fully understand before adding ML. Complex models that you can\'t explain are dangerous in live markets.'
      },
      {
        id: 'complete-system', title: 'Building a Complete Trading System', sub: 'Universe, filter, entry, exit, sizing, review loop',
        phase: 'Systems', diff: 4,
        summary: 'A complete trading system has 7 components that work together. Most traders only think about entry; professionals think about the entire system as an integrated machine.',
        concepts: ['Component 1: Universe — what instruments you will trade','Component 2: Market filter — when conditions are right vs wrong','Component 3: Entry signal — objective, rule-based trigger','Component 4: Entry order — limit vs market, timing','Component 5: Stop loss — structural, ATR-based, or time-based','Component 6: Exit target — mechanical or trailing','Component 7: Position sizing — R-based, volatility-adjusted','The review loop: backtest → paper trade → small live → full size','System documentation: trading manual as professional reference','Edge case rules: what to do when unusual events occur','Emergency protocol: technology failure, news event during trade','Living system: how and when to modify a working system'],
        resources: [{type:'Book',name:'Trade Your Way to Financial Freedom — Van Tharp'},{type:'Book',name:'The Complete TurtleTrader — Michael Covel'},{type:'Video',name:'Building a Trading System — YouTube'}],
        tip: 'Write your trading manual before you trade live. If you ever feel the urge to deviate from your system, you must update the manual first — not deviate in the moment.'
      },
      {
        id: 'paper-to-live', title: 'Paper-to-Live Transition Protocol', sub: 'Gradual scaling, minimum requirements, go/no-go',
        phase: 'Systems', diff: 3,
        summary: 'The transition from paper trading to live trading is the hardest bridge in trading education. Real money changes everything psychologically. Having a structured protocol prevents premature live trading.',
        concepts: ['Paper trading minimum: 3 months consistent profitable','Minimum live trading requirements: define them in advance','Starting size: 10–25% of intended position size','Metrics to track: win rate, avg R/R, expectancy over 30 trades','Go criteria: positive expectancy, no major rule violations for 30 days','No-go criteria: any of the key rules broken consistently','The psychological shift: emotions return with real money','Micro sizing phase: trade real money but tiny positions','Full size phase: gradual increase over months not weeks','Account size requirements: enough to trade the system properly','Loss limits in early live trading: very conservative','The first losing day live: the true test of your system commitment'],
        resources: [{type:'Book',name:'The New Trading for a Living — Dr. Alexander Elder'},{type:'Video',name:'When to Go Live — Warrior Trading'},{type:'Article',name:'Paper to Live Trading Guide — TradingView blog'}],
        tip: 'If you\'re consistently profitable in paper trading but immediately lose in live, the difference is emotional. Paper trading perfectly while live trading poorly is a psychology problem, not a strategy problem.'
      }
    ]
  },
  // ─────────────────────────────────────────────
  // PHASE 16: MASTERY & PROFESSIONAL
  // ─────────────────────────────────────────────
  {
    id: 'p16', label: 'Phase 16 — Mastery & Professional', num: '16', est: 'Ongoing',
    color: '#5a3ec8', light: '#ede9fe', bg: 'rgba(90,62,200,0.12)', check: '#5a3ec8',
    nodes: [
      {
        id: 'portfolio-management-advanced', title: 'Portfolio Management at Scale', sub: 'Allocation, rebalancing, factor exposure, drawdown protocols',
        phase: 'Mastery', diff: 4,
        summary: 'When managing a significant portfolio, individual trade thinking gives way to portfolio-level thinking. Allocation, correlation management, factor exposure, and drawdown protocols become the primary tools.',
        concepts: ['Portfolio construction: position sizing across opportunities','Factor exposure: momentum, value, quality, low-vol','Portfolio beta management: gross vs net exposure','Rebalancing: rules-based vs discretionary','Concentration limits: max % per position, sector, geography','Correlation-adjusted sizing: full correlation reduces size','Drawdown triggers: reduce exposure at -10%, -20% portfolio DD','Leverage: when and how much — volatility-adjusted','Tax-loss harvesting: managing unrealized losses strategically','Cash as a position: when to reduce exposure','Factor timing: which factors work in which macro regime','Institutional portfolio management: IPS, benchmarking, attribution'],
        resources: [{type:'Book',name:'Active Portfolio Management — Grinold & Kahn'},{type:'Book',name:'The Intelligent Asset Allocator — William Bernstein'},{type:'Course',name:'CFA Institute: Portfolio Management'}],
        tip: 'As your account grows, your biggest risk is no longer individual bad trades — it\'s correlated positions in a market crash. Build your correlation matrix and stress-test quarterly.'
      },
      {
        id: 'taxes-legal', title: 'Taxes, Legal Structure & Compliance', sub: 'Mark-to-market, wash sale, trader status, entity structure',
        phase: 'Mastery', diff: 3,
        summary: 'Tax and legal structure can make a 30%+ difference in after-tax returns over time. Professional traders use appropriate legal entities and tax elections to optimize their situation.',
        concepts: ['Short-term capital gains: taxed as ordinary income','Long-term capital gains: held 1+ year, lower rate','Wash sale rule: 30-day rule for losses + repurchase','Mark-to-market election (Section 475(f)): converts to ordinary income/loss, avoids wash sale','Trader status vs investor status: IRS criteria','Business expenses: deductible for qualified traders','LLC vs S-Corp vs sole proprietor for trading','Futures tax treatment: 60/40 rule (Section 1256)','Crypto tax: every trade is a taxable event (US)','IRA trading: no immediate taxation but withdrawal rules','Tax-loss harvesting strategies','International trader tax considerations'],
        resources: [{type:'Book',name:'Trader\'s Tax Survival Guide — Green Trader Tax'},{type:'Website',name:'GreenTraderTax.com — specialized trader tax resources'},{type:'Professional',name:'Hire a CPA specializing in traders before April'}],
        tip: 'Consult a CPA who specializes in traders before your first full year of active trading. The tax implications of different strategies and structures can fundamentally change your net returns.'
      },
      {
        id: 'prop-trading', title: 'Prop Trading, Funding & Careers', sub: 'Prop firms, funded accounts, hedge fund paths',
        phase: 'Mastery', diff: 3,
        summary: 'Prop trading offers the ability to trade larger capital than you personally own. Understanding the landscape — from retail funded accounts to institutional prop desks — opens multiple career paths.',
        concepts: ['Retail prop firms: FTMO, MyForexFunds, TopStep Trader','Evaluation process: challenge accounts, drawdown limits','Profit split: typically 80/20 in trader\'s favor','Rules: daily loss limits, max drawdown, consistency','Firm-backed prop trading: more capital, more oversight','Advantages: leverage without personal capital risk','Disadvantages: strict rules, performance pressure','Hedge fund analyst path: research + modeling skills required','Portfolio manager progression at hedge funds','Family office and RIA: managing private client capital','Starting your own fund: legal requirements (RIA registration, etc.)','CTAs and CPOs: commodity pool operator registration'],
        resources: [{type:'Website',name:'TopStep Trader — equities/futures funded accounts'},{type:'Website',name:'FTMO — forex/crypto funded accounts'},{type:'Book',name:'Hedge Fund Market Wizards — Jack Schwager'},{type:'Video',name:'Prop Trading Careers — YouTube'}],
        tip: 'Treat a prop firm evaluation as if it\'s your own capital. Traders who blow evaluations are usually breaking rules they would never break with their own money.'
      },
      {
        id: 'alternative-data', title: 'Alternative Data & Advanced Research', sub: 'Satellite data, credit card data, NLP, web scraping',
        phase: 'Mastery', diff: 5,
        summary: 'Alternative data refers to non-traditional datasets that provide information about companies and the economy before it shows up in standard financial metrics. It is the frontier of information edge.',
        concepts: ['Alternative data definition: any non-traditional dataset','Credit/debit card transaction data: consumer spending in real-time','Satellite imagery: parking lot car counts, oil tanker tracking','App store data: downloads, reviews, usage metrics','Web traffic data: SimilarWeb, SEMrush as business intelligence','Job posting data: company growth and focus areas','Social media sentiment NLP: Twitter/Reddit signal extraction','Supply chain data: shipping manifests, commodity flows','FDA trial data mining: clinical trial outcomes prediction','Short interest changes as alternative signal','Earnings call NLP: sentiment and language analysis','Accessing alt data: quandl, Bloomberg, specialized vendors'],
        resources: [{type:'Book',name:'Big Data and Machine Learning in Quantitative Investment — Tony Guida'},{type:'Website',name:'AlternativeData.org — alt data marketplace'},{type:'Paper',name:'Kolanovic & Krishnamachari: Big Data and AI Strategies — JP Morgan'},{type:'Tool',name:'Quandl (Nasdaq Data Link) — alternative data API'}],
        tip: 'Most retail traders will never access true alt data. But understanding it helps you anticipate what institutional traders are seeing — and position before the data is public.'
      },
      {
        id: 'continuous-improvement', title: 'Continuous Improvement Systems', sub: 'Deliberate practice, feedback loops, edge maintenance',
        phase: 'Mastery', diff: 3,
        summary: 'The market evolves. Strategies that worked in 2020 may not work in 2025. Building deliberate improvement systems — not just trading — is what separates traders who last decades from those who burn out.',
        concepts: ['Monthly performance review: qualitative + quantitative','Annual system audit: does each rule still make sense?','Learning from best trades: doubling down on what works','Learning from worst trades: root cause analysis','Peer review: accountability partner or small trading group','Following market structure changes: HFT impact, new instruments','Reading research: academic papers, quantitative studies','Deliberate practice: simulated trading specific problem areas','Mental skills training: performance coaches for advanced traders','Goal setting: specific, measurable quarterly targets','The journey from unconscious incompetence to unconscious competence','Contributing to community: teaching accelerates your own learning'],
        resources: [{type:'Book',name:'Peak — Anders Ericsson (deliberate practice)'},{type:'Book',name:'The Daily Trading Coach — Steenbarger'},{type:'Video',name:'Building a Trader Development System — SMB Capital'}],
        tip: 'The best traders in the world still have coaches, still keep journals, and still do systematic performance reviews. If you\'ve stopped doing these, complacency has set in.'
      },
      {
        id: 'trading-identity', title: 'Trading Identity & Long-Term Vision', sub: 'Sustainable career, purpose, legacy, community',
        phase: 'Mastery', diff: 2,
        summary: 'The final phase of mastery is integrating trading into a sustainable life. Trading as a career has real costs — cognitive, social, and physical. Building a vision beyond "making money" is what keeps elite traders going for decades.',
        concepts: ['Identity as a trader: process-focused, not outcome-focused','Why trading must be tied to a larger purpose','The isolated trader problem: deliberate connection and community','Physical and mental sustainability: marathon vs sprint','Managing lifestyle creep as profits grow','Giving back: mentoring, education, research sharing','The trader\'s legacy: what will you have built?','Beyond trading: how skills transfer to investing, business, analysis','Managing relationships around trading (family, time, stress)','Financial independence vs grinding: knowing when enough is enough','Transitioning from active trader to portfolio investor over time','The trader\'s definition of success: yours, not others\''],
        resources: [{type:'Book',name:'Man\'s Search for Meaning — Viktor Frankl'},{type:'Book',name:'The Defining Decade — Meg Jay'},{type:'Podcast',name:'The Tim Ferriss Show: high-performance psychology episodes'}],
        tip: 'Define what "successful trading" means to you — not to Reddit, not to Twitter. A trader who makes $80K/year consistently, lives comfortably, and has time for family is more successful than one making $500K while burning out.'
      }
    ]
  }
];
