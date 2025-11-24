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
import { type UserRegisterDtoType, UserRegisterDto } from "@backend/users/users.dto";

export default function RegisterPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<UserRegisterDtoType>({
    resolver: zodResolver(UserRegisterDto),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      name: "",
      rememberMe: false,
    },
  });

  const registerMutationOptions = trpc.users.postRegisterLocal.mutationOptions();
  const registerMutation = useMutation({
    ...registerMutationOptions,
    onSuccess: () => {
      router.push("/");
    },
    onError: (error: any) => {
      if (error.data?.zodError) {
        // Handle Zod validation errors from backend
        const zodErrors = error.data.zodError.fieldErrors;
        zodErrors.forEach((fieldError: any) => {
          setError(fieldError.path[0] as any, {
            message: fieldError.message,
          });
        });
      } else {
        setError("root", {
          message: error.message || "Registration failed. Please try again.",
        });
      }
    },
  });

  const onSubmit = (data: UserRegisterDtoType) => {
    registerMutation.mutate({
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      name: data.name,
      rememberMe: data.rememberMe,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-12">
      <div className="w-full max-w-md">
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Sign in
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
                label="Display Name"
                type="text"
                placeholder="John Doe"
                error={errors.name?.message}
                required
                {...register("name")}
              />

              <FormField
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                required
                {...register("email")}
              />

              <FormField
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                placeholder="+1234567890"
                error={errors.phone?.message}
                required
                {...register("phone")}
              />

              <FormField
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                helperText="Min 8 characters with uppercase, lowercase, number, and symbol"
                error={errors.password?.message}
                required
                {...register("password")}
              />

              <FormField
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                required
                {...register("confirmPassword")}
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
                disabled={registerMutation.isPending}
                variant="primary"
                size="md"
                fullWidth
              >
                {registerMutation.isPending ? "Creating account..." : "Create account"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
