import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardBody } from "../ui/card";

export function AuthActions() {
  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <CardBody className="text-center py-8">
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Sign in to access your bookings and manage your trips
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
