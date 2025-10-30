import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type VerificationEmailProps = {
  username: string;
  verificationLink: string;
};

export const VerificationEmail = ({
  username,
  verificationLink,
}: VerificationEmailProps) => {
  const previewText = "Verify your WestMatch email";

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            {/* <Section className="mt-[32px]">
              <Img
                alt="WestMatch Logo"
                className="mx-auto my-0"
                height="37"
                src={`${baseUrl}/static/westmatch-logo.png`}
                width="40"
              />
            </Section> */}
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              Verify your <strong>WestMatch</strong> email
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              Welcome to WestMatch! Click the button below to verify your email
              address and get started.
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href={verificationLink}
              >
                Verify Email
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link
                className="text-blue-600 no-underline"
                href={verificationLink}
              >
                {verificationLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This verification email was sent to{" "}
              <span className="text-black">{username}</span>. If you did not
              create a WestMatch account, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
