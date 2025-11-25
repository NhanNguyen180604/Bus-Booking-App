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
          <p className="text-secondary-text dark:text-secondary-text mb-6">
            Sign in to <span className= "font-bold text-text">BusBus</span> to bus anywhere, anytime!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/users/login">
              <Button variant="primary" size="lg">
                Login
              </Button>
            </Link>
            <Link href="/users/register">
              <Button variant="accent" size="lg">
                Sign Up
              </Button>
            </Link>
          </div>
        </CardBody>
    </Card>
    )}
  </>
  );
};


