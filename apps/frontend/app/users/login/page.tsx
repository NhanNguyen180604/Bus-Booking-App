"use client";

import { useTRPC } from "../../../utils/trpc";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "../../../components/ui/card";
import { FormField } from "../../../components/ui/form-field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UserLoginDtoType, UserLoginDto } from "@backend/users/users.dto";

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
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background px-4">
      <div className="w-full max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-center text-3xl font-bold tracking-tight text-text dark:text-text">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-text dark:text-secondary-text">
              Or{" "}
              <Link
                href="register"
                className="font-medium text-accent hover:text-accent/50 dark:text-accent"
              >
                create a new account
              </Link>
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardBody className="space-y-4">
              {errors.root && (
                <div className="rounded-md bg-danger dark:bg-danger p-4">
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
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
