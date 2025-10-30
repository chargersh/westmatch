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

type ResetPasswordEmailProps = {
  username: string;
  resetLink: string;
  requestedAt: string;
};

export const ResetPasswordEmail = ({
  username,
  resetLink,
  requestedAt,
}: ResetPasswordEmailProps) => {
  const previewText = "Reset your WestMatch password";

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
              Reset your <strong>WestMatch</strong> password
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              We received a request to reset your password for your WestMatch
              account. Click the button below to create a new password.
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href={resetLink}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link className="text-blue-600 no-underline" href={resetLink}>
                {resetLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This password reset was requested for{" "}
              <span className="text-black">{username}</span> on{" "}
              <span className="text-black">{requestedAt}</span>. If you did not
              request a password reset, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
