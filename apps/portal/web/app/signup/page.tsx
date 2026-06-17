import JoinForm from "@/components/JoinForm";

// Membership application. The form posts to the portal-api members endpoint,
// which emails a verification link to the institutional address.
export default function SignupPage() {
  return <JoinForm />;
}
