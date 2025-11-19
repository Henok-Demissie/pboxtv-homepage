import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Tabs, Tab } from "@nextui-org/tabs";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";

export default function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [selected, setSelected] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  useEffect(() => {
    if (isOpen) {
      const initTurnstile = () => {
        if (window.turnstile) {
          const container = document.getElementById("turnstile-modal");
          if (container) {
            // Clear any existing turnstile widgets
            container.innerHTML = '';
            try {
              window.turnstile.render(container, {
                sitekey: import.meta.env.VITE_SITEKEY,
                callback: (token) => {
                  setCaptchaToken(token);
                },
                'error-callback': () => {
                  console.error('Turnstile error');
                  setCaptchaToken('');
                },
                'expired-callback': () => {
                  setCaptchaToken('');
                }
              });
            } catch (error) {
              console.error('Turnstile render error:', error);
            }
          }
        } else {
          // Retry if turnstile script hasn't loaded yet
          const script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            setTimeout(initTurnstile, 100);
          };
          if (!document.querySelector('script[src*="turnstile"]')) {
            document.head.appendChild(script);
          }
        }
      };
      const timeoutId = setTimeout(initTurnstile, 500);
      return () => clearTimeout(timeoutId);
    } else {
      // Reset captcha token when modal closes
      setCaptchaToken('');
    }
  }, [isOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA.");
      setIsLoading(false);
      return;
    }

    try {
      const WORKERURL = import.meta.env.VITE_WORKERURL;
      const response = await fetch(WORKERURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!data.message?.includes("successful")) {
        toast.error(data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      onClose();
      navigate("/", { replace: true });
      toast.success("User logged in successfully");
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        firstName: fname,
        lastName: lname,
      });

      toast.success("Account created successfully! Please sign in now.");
      setSelected("login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      classNames={{
        base: "bg-black/95 backdrop-blur-xl border border-gray-800",
        header: "border-b border-gray-800",
        body: "py-6",
        footer: "border-t border-gray-800"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-white">Welcome</h2>
              <p className="text-sm text-gray-400">Sign in to your account</p>
            </ModalHeader>
            <ModalBody>
              <Tabs
                fullWidth
                size="md"
                selectedKey={selected}
                onSelectionChange={setSelected}
                classNames={{
                  tabList: "bg-gray-900/50",
                  tab: "text-gray-300 data-[selected=true]:text-white",
                  panel: "pt-4"
                }}
              >
                <Tab key="login" title="Login">
                  <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                    <Input
                      isRequired
                      label="Email"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <Input
                      isRequired
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={toggleVisibility}
                        >
                          {isVisible ? (
                            <IoEye className="text-2xl text-gray-400" />
                          ) : (
                            <IoEyeOff className="text-2xl text-gray-400" />
                          )}
                        </button>
                      }
                      type={isVisible ? "text" : "password"}
                      onChange={(e) => setPassword(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <div id="turnstile-modal" className="flex justify-center"></div>
                    <Button
                      type="submit"
                      color="danger"
                      isLoading={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-700"></div>
                      <span className="text-xs text-gray-400">OR</span>
                      <div className="flex-1 h-px bg-gray-700"></div>
                    </div>
                    <SignInwithGoogle />
                  </form>
                </Tab>
                <Tab key="sign-up" title="Sign Up">
                  <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <Input
                      isRequired
                      label="First Name"
                      placeholder="Enter your first name"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <Input
                      isRequired
                      label="Last Name"
                      placeholder="Enter your last name"
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <Input
                      isRequired
                      label="Email"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <Input
                      isRequired
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={toggleVisibility}
                        >
                          {isVisible ? (
                            <IoEye className="text-2xl text-gray-400" />
                          ) : (
                            <IoEyeOff className="text-2xl text-gray-400" />
                          )}
                        </button>
                      }
                      type={isVisible ? "text" : "password"}
                      onChange={(e) => setPassword(e.target.value)}
                      classNames={{
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-900/50 border-gray-700"
                      }}
                    />
                    <Button
                      type="submit"
                      color="danger"
                      isLoading={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-700"></div>
                      <span className="text-xs text-gray-400">OR</span>
                      <div className="flex-1 h-px bg-gray-700"></div>
                    </div>
                    <SignInwithGoogle />
                  </form>
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}





