"use client";

import { useTRPC } from "../../utils/trpc";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "../../components/ui/card";
import { FormField } from "../../components/ui/form-field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe.toString(),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Or{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                create a new account
              </Link>
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardBody className="space-y-4">
              {errors.root && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
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
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Remember me
                </label>
              </div>
            </CardBody>

            <CardFooter>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                variant="primary"
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
