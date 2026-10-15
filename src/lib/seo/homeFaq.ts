// Visible homepage FAQ copy. FAQPage JSON-LD and the Organization
// description both read from here so the quoted answer cannot drift.
// Durations and price match JOB_DURATION_DAYS (60), FEATURED_DURATION_DAYS (30),
// and FEATURED_PRICE_CENTS (9900).

export type HomeFaqItem = {
  question: string;
  answer: string;
  open?: boolean;
};

export type HomeFaqGroup = {
  id: string;
  label: string;
  items: HomeFaqItem[];
};

export const HOME_FAQ_GROUPS: HomeFaqGroup[] = [
  {
    id: "seekers",
    label: "Job seekers",
    items: [
      {
        question: "What is Nuclear Hustle?",
        answer:
          "Nuclear Hustle (nuclearhustle.com) is a job board for US nuclear power plant jobs. It lists operations, maintenance, engineering, health physics, security, and training roles from plant operators and from employers who post directly.",
        open: true,
      },
      {
        question: "Is Nuclear Hustle free?",
        answer:
          "Yes. Search, apply, and the Monday digest are free. An account is optional. Saving a role needs a free account.",
      },
      {
        question: "What nuclear jobs are listed?",
        answer:
          "US nuclear plant roles: operations, including reactor operator and senior reactor operator, plus maintenance, engineering, health physics, security, training, and administrative. Listings come from operator career sites and from employers who post here directly.",
      },
      {
        question: "How do I find a job on Nuclear Hustle?",
        answer:
          "Search by role, plant, or city, or browse by role and state. Open a listing and apply on the employer's site, or apply here and we email them your CV. Add your email and we send a Monday digest of new roles.",
      },
      {
        question: "Where do I apply?",
        answer:
          "On the employer's site, or here. Each listing does one or the other. If it is here, we email the employer your CV.",
      },
      {
        question: "How do I get alerts?",
        answer:
          "Put your email in the form on this page. We send a Monday digest of new roles. Every email has a one-click unsubscribe.",
      },
    ],
  },
  {
    id: "employers",
    label: "Employers",
    items: [
      {
        question: "How does posting a job work?",
        answer:
          "Create an employer account and publish a listing. It stays up for 60 days at no charge. Send applicants to your careers URL, or take applications by email with the CV attached. Featuring a listing pins it to the top of the board and the homepage for 30 days and costs $99.",
      },
      {
        question: "What does a job posting cost?",
        answer:
          "Nothing. A listing stays live for 60 days. Featuring it — pinned to the top of the board and the homepage — is $99 for 30 days.",
      },
      {
        question: "Can applicants go to our own careers site?",
        answer:
          "Yes. Paste that role's application URL, or take applications by email with the CV attached. Your applicant tracking system stays in place.",
      },
    ],
  },
];

export const HOME_FAQS: HomeFaqItem[] = HOME_FAQ_GROUPS.flatMap(
  (group) => group.items
);

export const HOME_ENTITY_DESCRIPTION = HOME_FAQS[0].answer;
