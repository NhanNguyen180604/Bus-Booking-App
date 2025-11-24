# Reusable Layout Components

## Components Overview

### 1. AppShell (Header, Nav, Content, Footer)
Complete page layout with header, sidebar navigation, main content area, and footer.

### 2. Card
Flexible card component with header, body, and footer sections.

### 3. Button
Versatile button component with multiple variants and sizes.

### 4. FormField
Input field component with label, validation, icons, and helper text.

---

## Usage Examples

### AppShell

```tsx
import { AppShell } from "@/components/layout/app-shell";

// Basic usage with defaults
export default function Page() {
  return (
    <AppShell>
      <h1>Your content here</h1>
    </AppShell>
  );
}

// Custom header, nav, footer
export default function CustomPage() {
  return (
    <AppShell
      header={<CustomHeader />}
      nav={<CustomNav />}
      footer={<CustomFooter />}
    >
      <h1>Your content here</h1>
    </AppShell>
  );
}

// Hide specific sections
export default function MinimalPage() {
  return (
    <AppShell hideNav hideFooter>
      <h1>Just header and content</h1>
    </AppShell>
  );
}
```

### Card

```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Basic card
<Card>
  <CardBody>
    <p>Simple card content</p>
  </CardBody>
</Card>

// Full card with header and footer
<Card variant="elevated" padding="lg">
  <CardHeader>
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-sm text-zinc-600">Subtitle or description</p>
  </CardHeader>
  <CardBody>
    <p>Main card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="default">Default border</Card>
<Card variant="elevated">With shadow</Card>
<Card variant="outlined">Thick border</Card>

// Padding options
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding (default)</Card>
<Card padding="lg">Large padding</Card>
<Card padding="none">No padding</Card>
```

### Button

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Disabled
<Button disabled>Disabled</Button>

// With onClick
<Button onClick={() => console.log("clicked")}>
  Click me
</Button>
```

### FormField

```tsx
import { FormField } from "@/components/ui/form-field";

// Basic input
<FormField
  label="Email"
  type="email"
  placeholder="you@example.com"
/>

// With helper text
<FormField
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// With error
<FormField
  label="Username"
  type="text"
  error="Username is already taken"
/>

// With icons
<FormField
  label="Search"
  type="text"
  startIcon={<SearchIcon />}
  endIcon={<ClearIcon />}
/>

// Required field
<FormField
  label="Name"
  type="text"
  required
/>

// Sizes
<FormField size="sm" label="Small" />
<FormField size="md" label="Medium (default)" />
<FormField size="lg" label="Large" />

// Variants
<FormField variant="default" />
<FormField variant="error" />
<FormField variant="success" />

// With react-hook-form
const { register } = useForm();

<FormField
  label="Email"
  {...register("email")}
  error={errors.email?.message}
/>
```

---

## Complete Form Example

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ExampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto">
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-2xl font-bold">Sign Up</h2>
            <p className="text-zinc-600">Create your account</p>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardBody className="space-y-4">
              <FormField
                label="Name"
                {...register("name")}
                error={errors.name?.message}
                required
              />
              <FormField
                label="Email"
                type="email"
                {...register("email")}
                error={errors.email?.message}
                required
              />
              <FormField
                label="Password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                helperText="Min 8 characters"
                required
              />
            </CardBody>
            <CardFooter>
              <Button type="submit" fullWidth>
                Create Account
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
```

---

## Component Props Reference

### AppShell Props
- `children` - Main content
- `header` - Custom header (optional)
- `nav` - Custom navigation (optional)
- `footer` - Custom footer (optional)
- `hideHeader` - Hide header (boolean)
- `hideNav` - Hide navigation (boolean)
- `hideFooter` - Hide footer (boolean)

### Card Props
- `variant` - "default" | "elevated" | "outlined"
- `padding` - "none" | "sm" | "md" | "lg"
- All standard div props

### Button Props
- `variant` - "primary" | "secondary" | "ghost"
- `size` - "sm" | "md" | "lg"
- `fullWidth` - boolean
- All standard button props

### FormField Props
- `label` - Field label (string)
- `helperText` - Helper text below input
- `error` - Error message (overrides helperText)
- `startIcon` - Icon on the left
- `endIcon` - Icon on the right
- `variant` - "default" | "error" | "success"
- `size` - "sm" | "md" | "lg"
- All standard input props
