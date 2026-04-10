import { useTheme } from '~/providers/ThemeProvider'
import { Container } from './Container'

const faqs = [
  [
    {
      question: 'Why shouldn\'t I host a Spotify jam instead?',
      answer:
        'Fissa does not require you to be on the same network to jam. Besides, Fissa allows you to vote on the next song, allowing you to skip those bad songs on top of the queue.',
    },
    {
      question: 'Can I use Fissa without a Spotify account?',
      answer:
        'Unfortunately not. Fissa is just a tool for handling the order of songs in a playlist. Spotify is still doing all the hard work.',
    },
    {
      question: 'Do I need a Spotify premium account?',
      answer:
        'If you would like to be the host of a Fissa, you are required to have a premium subscription. Others joining your Fissa can do so on a free account.',
    },
  ],
  // [
  //   {
  //     question: 'Do the people giving you tips realize what they are doing?',
  //     answer:
  //       'Again I would argue this isn’t really our responsibility. People make their own choices. If they don’t research the consequences that’s on them, not on us.',
  //   },
  //   {
  //     question: 'Where is Pocket based?',
  //     answer:
  //       'Let’s just say it’s not somewhere where the SEC is going to find us.',
  //   },
  //   {
  //     question: 'Is there any age limit to trading on Pocket?',
  //     answer:
  //       'For our free plan, the age limit is based on the minimum age to trade in your country of residence. Our VIP plan uses advanced transaction anonymization though, so you can use that plan even if you’re 9 years old. Or a dog.',
  //   },
  // ],
  [
    {
      question: 'Can Fissa also do...',
      answer:
        'Probably not, but we love to hear your ideas! Reach out to us for any feature request you have. We are always looking for ways to improve Fissa.',
    },
    {
      question: 'How can I support Fissa?',
      answer:
        'Tell you friends, colleagues, grandma and her cat! Fissa is a small hobby project and we would love to see it grow.',
    },
    {
      question: 'Fissa is awesome!',
      answer:
        'Not realy a question, but thank you. You are awesome too ♥️!',
    },
  ],
]

export function Faqs() {
  const { theme } = useTheme()

  return (
    <section
      id="faqs"
      aria-labelledby="faqs-title"
      className="border-t border-gray-200 py-20 sm:py-32"
      style={{ backgroundColor: theme['100'] }}
    >
      <Container style={{ color: theme['900'] }}>
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faqs-title"
            className="text-3xl font-medium tracking-tight"
          >
            Frequently asked questions
          </h2>
          <p className="mt-2 text-lg">
            If you have anything else you want to ask,{' '}
            <a
              href="mailto:mail@sanderboer.nl"
              className="text-gray-900 underline"
            >
              reach out to us
            </a>
            .
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="space-y-10">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-gray-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
