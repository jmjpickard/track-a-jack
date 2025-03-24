import React, { useState } from "react";
import { useRouter } from "next/router";
import { NavBar } from "~/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

/**
 * Register component for user signup
 * Handles user registration with form validation and submission
 */
const Register = (): JSX.Element => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  /**
   * Validates the form inputs before submission
   * Checks for matching passwords, password strength, and valid username format
   */
  const validateForm = (): { isValid: boolean; errorMessage?: string } => {
    // Check if passwords match
    if (password !== confirmPassword) {
      return { isValid: false, errorMessage: "Passwords do not match" };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        isValid: false,
        errorMessage: "Password must be at least 8 characters long",
      };
    }

    // Validate username format
    if (username.length < 3) {
      return {
        isValid: false,
        errorMessage: "Username must be at least 3 characters long",
      };
    }

    // Check username contains only valid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return {
        isValid: false,
        errorMessage:
          "Username can only contain letters, numbers, underscores and hyphens",
      };
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        isValid: false,
        errorMessage: "Please enter a valid email address",
      };
    }

    return { isValid: true };
  };

  /**
   * Handles form submission for user registration
   * Validates inputs and sends registration request to the server
   */
  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate inputs
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errorMessage ?? "Validation failed");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Registration failed");
      } else {
        // Redirect to login page
        void router.push("/signin?registered=true");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div className="container mt-8 flex max-w-sm flex-col items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Fill out the form below to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourusername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Username can only contain letters, numbers, underscores and
                    hyphens
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" disabled={isSubmitting} className="mt-2">
                  {isSubmitting ? "Creating Account..." : "Register"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/signin" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default Register;
