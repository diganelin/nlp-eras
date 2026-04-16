import corpus from "./corpus.json";

// Real UCI SMS Spam Collection sample — 500 train, 100 test.
// We use these for training and for measuring accuracy.
export const TRAIN_CORPUS = corpus.train;
export const TEST_CORPUS  = corpus.test;

// Hand-curated pairs for the labeling stage. Tagged by difficulty so each
// session can sample a balanced set: easy → medium → hard.
// These are NOT in the train/test split.
const LABELING_POOL = [
  // ── EASY: obvious spam vs casual legit ──
  {
    difficulty: "easy",
    spam: "WINNER!! As a valued network customer you have been selected to receive a $1,200 prize reward! To claim call 09061701461.",
    ham:  "Nah I don't think he goes to usf, he lives around here though",
  },
  {
    difficulty: "easy",
    spam: "Congrats! 2 free 3G Videophones R yours. call 09061744553 now! $0.99/msg",
    ham:  "Lol your always so convincing.",
  },
  {
    difficulty: "easy",
    spam: "PRIVATE! Your 2003 Account Statement shows 800 un-redeemed points. Call 08719899229 to claim.",
    ham:  "What time you coming down later?",
  },
  {
    difficulty: "easy",
    spam: "Sunshine Quiz! Win a super Sony DVD recorder if u can name the capital of Australia? Text MQUIZ to 82277.",
    ham:  "Sorry, in meeting I'll call you later",
  },

  // ── MEDIUM: scam-shaped spam vs casual-but-text-heavy legit ──
  {
    difficulty: "medium",
    spam: "Free entry in 2 a wkly comp to win Super Bowl tkts. Text SB to 87121 to receive entry question.",
    ham:  "Hey i've booked the 2 lessons on Wed already... Can you confirm",
  },
  {
    difficulty: "medium",
    spam: "FreeMsg: Claim ur 250 SMS messages — Text OK to 84025 now! Join Txt250.com for $1.99/wk.",
    ham:  "Did you catch the bus? Are you frying an egg? Did you make a tea?",
  },
  {
    difficulty: "medium",
    spam: "Get exclusive USA ringtone, reply USAM 4 mono or USAP 4 poly. Tones $3.99, carrier rates apply.",
    ham:  "Lyft: Your driver Sarah is 3 minutes away in a black Honda Civic, plate 8KQR291.",
  },
  {
    difficulty: "medium",
    spam: "U have a Secret Admirer who is looking 2 make contact with U — find out who on 09058094594",
    ham:  "Doordash: Your order from Chipotle is on the way. ETA 7:42pm. Track: ddash.co/x4f9j",
  },

  // ── HARD: spam vs legit service text that shouts and uses urgency/links ──
  {
    difficulty: "hard",
    spam: "URGENT! Your phone number has been awarded with a $2,500 prize GUARANTEED. Call 09061701461 from landline.",
    ham:  "Wells Fargo: A purchase of $487.32 at BESTBUY was attempted on your card ending 4521. Reply YES if this was you, NO to block immediately.",
  },
  {
    difficulty: "hard",
    spam: "Free Msg: Ringtone! Reply TONE to get 5 ringtones per week. Cost $1.99/wk.",
    ham:  "USPS: Your package could not be delivered. Reschedule at usps.com/redelivery before tomorrow or it will be returned to sender.",
  },
  {
    difficulty: "hard",
    spam: "Someone has contacted our dating service and entered your phone because they fancy you! To find out who it is call 09058098002 now",
    ham:  "Apple ID: Your account was used to purchase $129.99 from the App Store on a new device. If this was not you, secure your account at appleid.apple.com immediately.",
  },
  {
    difficulty: "hard",
    spam: "Auction round 4. The highest bid is now $70. Next maximum bid is $90. To bid, send BIDS 10 to 83383. Good luck.",
    ham:  "Bank of America: Your debit card ending in 2847 was used at COSTCO for $124.18. Reply Y if this was you, NO to dispute.",
  },
  {
    difficulty: "hard",
    spam: "Hi, this is Mandy Sullivan calling from HOTMIX FM... you are chosen to receive $5,000 in our Easter Prize draw.",
    ham:  "Robinhood: Your one-time verification code is 528193. Do not share this code with anyone, ever.",
  },
  {
    difficulty: "hard",
    spam: "Your phone has won a $2,500 bonus caller prize on 02/9/03! This is our 2nd attempt to reach YOU! Call 09066362231.",
    ham:  "T-Mobile: Your bill of $87.43 is due 4/22. Pay at t-mo.co/pay to avoid late fee.",
  },
  {
    difficulty: "medium",
    spam: "ALERT: Your vote matters! Reply JOIN to 90210 to support the Freedom Now campaign. Msg&data rates apply. Txt STOP to end.",
    ham:  "Reminder: Your polling place is Lincoln Elementary, 420 Oak St. Polls open 7am-8pm tomorrow. Bring photo ID.",
  },

  // ── HARD: phishing vs real service alerts ──
  {
    difficulty: "hard",
    spam: "USPS: We attempted to deliver your package but could not reach you. Schedule a redelivery now: usps-redelivery.com/track?id=9k2x",
    ham:  "FedEx: Your package is scheduled to arrive tomorrow by 8pm. Tracking #: 7749 0102 3344. No action needed.",
  },
  {
    difficulty: "hard",
    spam: "Chase: Unusual sign-in detected on your account. If this wasn't you, verify your identity immediately at chase-secure.com/verify",
    ham:  "Chase: Did you attempt a $312.47 purchase at WALMART on 3/15? Reply Y or N. If you didn't make this purchase, reply N and we'll block the card.",
  },
  {
    difficulty: "medium",
    spam: "Amazon: Your account has been locked due to suspicious activity. Verify now to restore access: amzn-support.co/unlock",
    ham:  "Amazon: Your order #112-4839271 has shipped and will arrive Thursday. Track at amazon.com/orders",
  },
  {
    difficulty: "hard",
    spam: "IRS NOTICE: You have an unclaimed tax refund of $1,284.00. File now to receive your payment: irs-taxrefund.com/claim",
    ham:  "TurboTax: Your 2024 federal return was accepted by the IRS. Your refund of $1,847.00 is expected by 3/14. No action needed.",
  },
  {
    difficulty: "hard",
    spam: "E-ZPass: You have an unpaid toll of $6.99. To avoid a $50 late fee, pay now at ezpass-tollpay.com/settle",
    ham:  "E-ZPass: Your account was replenished $25.00 on 3/12. Current balance: $31.40. Manage at ezpassnj.com",
  },
  {
    difficulty: "hard",
    spam: "Greenfield USD: URGENT - Your student's records need immediate verification or enrollment will be suspended. Update at greenfield-verify.net/parent",
    ham:  "Greenfield USD: Your student Emma was marked absent today (3/15). If this is an error, contact the attendance office at 555-0142.",
  },
  {
    difficulty: "medium",
    spam: "Netflix: Your payment failed and your account will be suspended in 24hrs. Update billing info: netflix-billing.com/update",
    ham:  "Netflix: Your plan has been upgraded to Standard. You'll be charged $15.49/mo starting 4/1. Manage at netflix.com/account",
  },
];

// Sample 5 rounds for a session: 1 easy, 2 medium, 2 hard. Shuffled within each
// bucket, concatenated easy → medium → hard so difficulty escalates.
export function sampleLabelingRounds() {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const p of LABELING_POOL) buckets[p.difficulty].push(p);
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return [
    ...shuffle(buckets.easy).slice(0, 1),
    ...shuffle(buckets.medium).slice(0, 2),
    ...shuffle(buckets.hard).slice(0, 2),
  ];
}

// English stopwords — skipped when auto-picking common words for the
// "use more words" stage.
export const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","of","at","by","for","with","about",
  "to","from","in","on","into","over","under","up","down","out","off","is",
  "am","are","was","were","be","been","being","have","has","had","do","does",
  "did","doing","will","would","shall","should","can","could","may","might",
  "must","i","you","he","she","it","we","they","me","him","her","us","them",
  "my","your","his","its","our","their","this","that","these","those","not",
  "no","yes","so","as","than","then","there","here","when","where","why","how",
  "what","who","which","just","too","very","also","only","more","most","some",
  "any","all","each","every","such","other","another","both","one","two",
  "again","still","ever","never","always","yet","ok","im","u","ur","ll","ve",
  "re","s","t","d","m"
]);
