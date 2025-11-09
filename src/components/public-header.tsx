
"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/cart-context";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "./user-nav";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/agent", label: "DIFAE Agent" },
  { href: "/products", label: "Solutions" },
  { href: "/pre-booking", label: "Pre-Booking" },
  { href: "/contact", label: "Contact" },
];

export default function PublicHeader() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    isCartOpen,
    setCartOpen,
  } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(7,12,27,0.92)] backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-3 px-6 sm:px-10 lg:px-12">
        <Link href="/" className="group flex items-center gap-3 text-sm font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 font-headline text-lg font-bold text-white transition group-hover:shadow-[0_0_25px_rgba(120,119,198,0.35)]">
            B
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-[0.35em] text-white/50">Berreto</span>
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-base font-semibold text-transparent">
              DIFAE Security Cloud
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
              <span className="absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-primary via-secondary to-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 border border-white/10 bg-white/5 text-white shadow-sm shadow-primary/20 hover:bg-white/10"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-primary text-[10px] font-bold uppercase tracking-tight text-primary-foreground">
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Open shopping cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col border-l border-white/10 bg-[rgba(5,10,23,0.96)] text-white backdrop-blur-xl sm:max-w-md">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">Your DIFAE Kit</h2>
                <p className="text-sm text-white/60">Seamless protection, curated for you.</p>
              </div>
              {cartItems.length > 0 ? (
                <>
                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <ul className="space-y-6">
                      {cartItems.map((item) => (
                        <li
                          key={item.id}
                          className="group flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-black/30 transition hover:border-primary/60 hover:bg-white/10"
                        >
                          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-white">{item.name}</h3>
                                <p className="text-sm text-white/60">Rs {item.price.toLocaleString()}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/60 hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove from cart</span>
                              </Button>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/80">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-semibold">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="text-sm font-medium text-white/70">
                                Total: Rs {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-white/10 px-6 py-6">
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Subtotal</span>
                        <span className="text-lg font-semibold text-white">Rs {cartTotal.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-white/50">
                        Complimentary deployment support across Pakistan on every order.
                      </p>
                      <SheetClose asChild>
                        <Button asChild className="w-full text-base font-semibold">
                          <Link href="/checkout">Secure Checkout</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <ShoppingCart className="h-7 w-7 text-white/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Your cart is standing by</h3>
                    <p className="text-sm text-white/60">
                      Add a plan or device to activate your autonomous security perimeter.
                    </p>
                  </div>
                  <SheetClose asChild>
                    <Button asChild variant="secondary" className="mt-2">
                      <Link href="/products">Explore Solutions</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <UserNav />
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="h-10 rounded-full border border-white/10 bg-transparent px-5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                >
                  <Link href="/signup">Create Account</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-full max-w-xs flex-col border-r border-white/10 bg-[rgba(5,10,23,0.96)] text-white backdrop-blur-xl">
                <div className="border-b border-white/10 px-6 py-6">
                  <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
                    <span className="font-headline">BERRETO</span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-widest text-white/70">
                      DIFAE AI
                    </span>
                  </Link>
                </div>
                <nav className="grid gap-4 px-6 py-6 text-base font-medium">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link href={link.href} className="rounded-full border border-transparent px-3 py-2 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white">
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="my-4 border-t border-white/10" />
                  {user ? (
                    <>
                      <SheetClose asChild>
                        <Link href="/dashboard" className="rounded-full border border-transparent px-3 py-2 text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white">
                          Dashboard
                        </Link>
                      </SheetClose>
                      <Button
                        onClick={() => {
                          // Handle signout logic here
                        }}
                        variant="ghost"
                        className="justify-start rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <SheetClose asChild>
                        <Link href="/login" className="rounded-full border border-white/10 bg-transparent px-3 py-2 text-center text-white/70 transition hover:bg-white/10 hover:text-white">
                          Login
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/signup" className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                          Create Account
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
