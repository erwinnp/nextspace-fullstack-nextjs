import { SignUpForm } from "@/components/forms/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-10 justify-center items-center font-sans">
      <h1 className="text-4xl md:text-5xl font-semibold">NextSpace.</h1>
      <SignUpForm />
    </main>
  );
}
