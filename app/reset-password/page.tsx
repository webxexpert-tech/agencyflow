"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  validatePasswordStrength,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthBg,
  getPasswordStrengthColor,
} from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if user has a valid session (from reset email)
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    };

    checkSession();
  }, []);

  // Update password strength indicator
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const handleReset = async () => {
    setValidationError(null);
    setError(null);

    // Validate password strength
    const strengthValidation = validatePasswordStrength(password);
    if (!strengthValidation.valid) {
      setValidationError(strengthValidation.error || "Password does not meet requirements");
      return;
    }

    // Validate passwords match
    if (password !== confirm) {
      setValidationError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        setLoading(false);
        return;
      }

      setDone(true);
      toast.success("Password reset successfully!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">AgencyFlow</span>
        </div>

        {error ? (
          <Card className="p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-red-600">Error</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Login
            </Button>
          </Card>
        ) : !done ? (
          <Card className="p-8 shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Set New Password</h1>
              <p className="text-muted-foreground text-sm">
                Choose a strong password to secure your account.
              </p>
            </div>

            {validationError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label>New Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters with uppercase, lowercase & numbers"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full ${
                            i < passwordStrength
                              ? getPasswordStrengthBg(passwordStrength)
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-medium ${getPasswordStrengthColor(
                        passwordStrength
                      )}`}
                    >
                      Password Strength:{" "}
                      {getPasswordStrengthLabel(passwordStrength)}
                    </p>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="space-y-1 ml-2">
                    <li className={password.length >= 8 ? "text-green-600" : ""}>
                      ✓ At least 8 characters
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(password) ? "text-green-600" : ""
                      }
                    >
                      ✓ At least one uppercase letter
                    </li>
                    <li
                      className={
                        /[a-z]/.test(password) ? "text-green-600" : ""
                      }
                    >
                      ✓ At least one lowercase letter
                    </li>
                    <li
                      className={/[0-9]/.test(password) ? "text-green-600" : ""}
                    >
                      ✓ At least one number
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    className={
                      confirm && password !== confirm
                        ? "border-red-500 pr-10"
                        : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleReset}
                disabled={loading || !password || !confirm}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-300">
                🔒 Your password is encrypted and transmitted securely. Never share
                your password with anyone.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-8 shadow-sm text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">
                Password Reset!
              </h2>
              <p className="text-muted-foreground text-sm">
                Your password has been successfully updated. You can now log in with
                your new password.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecting to login in 3 seconds...
            </p>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
