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
import { Container } from "@/components/ui/container";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/agent", label: "Agent" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact Us" },
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/70 backdrop-blur-xl">
      <Container className="flex h-20 items-center gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-headline text-xl font-semibold text-primary transition group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-primary/20">
            B
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-foreground">BERRETO</span>
          </div>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="absolute -bottom-2 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary via-primary/70 to-accent transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-2xl border border-primary/20 bg-white text-primary shadow-sm shadow-primary/10 hover:bg-primary/5"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] rounded-full bg-accent px-1 text-[10px] font-semibold tracking-tight text-white">
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Open shopping cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col border-l border-border/60 bg-white/95 text-foreground backdrop-blur-2xl sm:max-w-md">
              <div className="border-b border-border/60 px-6 py-5">
                <h2 className="text-lg font-headline font-semibold text-foreground">Your BERRETO Kit</h2>
                <p className="text-sm text-muted-foreground">Curate the devices that keep every perimeter protected.</p>
              </div>
              {cartItems.length > 0 ? (
                <>
                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <ul className="space-y-6">
                      {cartItems.map((item) => (
                        <li
                          key={item.id}
                          className="group flex gap-4 rounded-3xl border border-border/60 bg-white/80 p-4 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border/60 bg-muted">
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
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">Rs {item.price.toLocaleString()}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove from cart</span>
                              </Button>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/70 px-2 py-1 text-foreground">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-semibold">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">
                                Total: Rs {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-border/60 px-6 py-6">
                    <div className="space-y-4 rounded-3xl border border-border/60 bg-white/80 p-5 shadow-inner shadow-primary/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-lg font-semibold text-foreground">Rs {cartTotal.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Complimentary deployment support across Pakistan on every order.
                      </p>
                      <Button asChild className="w-full rounded-full">
                        <Link href="/checkout">Secure checkout</Link>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/60 bg-muted/70 text-primary">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-foreground">Your kit is waiting</p>
                    <p className="text-sm text-muted-foreground">
                      Add BERRETO devices to start preventing incidents before they unfold.
                    </p>
                  </div>
                  <Button asChild className="rounded-full">
                    <Link href="/products">Explore solutions</Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-2 lg:flex">
            {user ? (
              <UserNav />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/signup">Create account</Link>
                </Button>
              </>
            )}
          </nav>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-white text-primary hover:bg-primary/5 lg:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col border-l border-border/60 bg-white/95 text-foreground backdrop-blur-2xl sm:max-w-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-headline text-lg text-primary">
                    B
                  </span>
                  <span className="text-left leading-tight">
                    <span className="block text-base text-foreground">BERRETO</span>
                  </span>
                </Link>
              </div>
              <div className="flex flex-1 flex-col gap-6 py-6">
                <nav className="flex flex-col gap-2 text-base font-medium text-foreground">
                  {NAV_LINKS.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className="rounded-2xl px-4 py-2 transition hover:bg-primary/5 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto space-y-3">
                  {user ? (
                    <UserNav />
                  ) : (
                    <>
                      <Button asChild className="w-full rounded-full">
                        <Link href="/signup">Create account</Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full rounded-full text-muted-foreground hover:text-foreground">
                        <Link href="/login">Log in</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
