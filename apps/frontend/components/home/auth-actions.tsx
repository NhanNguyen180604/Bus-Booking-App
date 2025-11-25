'use client';
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardBody } from "../ui/card";
import useUser from "../../hooks/useUser";

export function AuthActions() {
  const { data, isLoading } = useUser();
  return (<>
    {!isLoading && !data && (
      <Card variant="elevated" className="max-w-2xl mx-auto">
        <CardBody className="text-center py-8">
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Sign in to access your bookings and manage your trips
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="users/login">
              <Button variant="primary" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="users/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </CardBody>
    </Card>
    )}
  </>
  );
};


