"use client";

import { useTRPC } from "../../../utils/trpc";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "../../../components/ui/card";
import { FormField } from "../../../components/ui/form-field";
import { GoogleOAuthButton } from "../../../components/auth/google-oauth-button";
import { FacebookOAuthButton } from "../../../components/auth/facebook-oauth-button";
import { GitHubOAuthButton } from "../../../components/auth/github-oauth-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UserLoginDtoType, UserLoginDto } from "@repo/shared";
import { AppShell } from "../../../components/layout/app-shell";

export default function LoginPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<UserLoginDtoType>({
    resolver: zodResolver(UserLoginDto),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutationOptions = trpc.users.postLoginLocal.mutationOptions();
  const loginMutation = useMutation({
    ...loginMutationOptions,
    onSuccess: () => {
      router.push("/");
    },
    onError: (error: any) => {
      setError("root", {
        message: error.message || "Login failed. Please try again.",
      });
    },
  });

  const onSubmit = (data: UserLoginDtoType) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
  };

  return (
    <AppShell hideNav>
      <div className="flex h-full items-center justify-center bg-background dark:bg-background px-4">
        <div className="w-full max-w-md">
          <Card variant="elevated">
            <CardHeader>
              <h2 className="text-center text-3xl font-bold tracking-tight text-text dark:text-text">
                Login
              </h2>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardBody className="space-y-4">
                {errors.root && (
                  <div className="rounded-md p-4">
                    <p className="text-sm text-danger dark:text-danger">{errors.root.message}</p>
                  </div>
                )}

                <FormField
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                <FormField
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-border dark:border-border text-accent focus:ring-accent focus:ring-offset-2"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-secondary-text dark:text-secondary-text"
                  >
                    Remember me
                  </label>
                </div>
              </CardBody>

              <CardFooter>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  variant="accent"
                  size="md"
                  fullWidth
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
                <p className="mt-2 text-center text-sm text-secondary-text dark:text-secondary-text">
                  Don't have an account?{" "}
                  <Link
                    href="/users/register"
                    className="font-medium text-accent hover:text-accent/50 dark:text-accent"
                  >
                    Register
                  </Link>
                </p>
                <div className="relative mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border dark:border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-surface dark:bg-surface px-2 text-secondary-text dark:text-secondary-text">
                      Or login with
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <GoogleOAuthButton />
                  <FacebookOAuthButton />
                  <GitHubOAuthButton />
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
