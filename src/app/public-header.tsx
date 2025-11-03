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
import { UserNav } from "@/components/user-nav";
import { useRouter } from "next/navigation";

export default function PublicHeader() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, isCartOpen, setCartOpen } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background">
      <div className="container mx-auto flex h-full items-center px-6 sm:px-10 lg:px-12">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg"
          >
            <span className="font-headline font-bold">BERRETO</span>
          </Link>
        </div>

        <nav className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Home</Link>
          <Link href="/about" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">About Us</Link>
          <Link href="/agent" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">DIFAE AI Agent</Link>
          <Link href="/products" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Products</Link>
          <Link href="/pre-booking" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Pre-Bookings</Link>
          <Link href="/contact" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Contact Us</Link>
        </nav>

        <div className="flex items-center gap-4 ml-auto">
           <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Open shopping cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md w-full flex flex-col">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-foreground">Shopping Cart</h2>
                </div>
              {cartItems.length > 0 ? (
                <>
                  <div className="flex-1 overflow-y-auto pr-4 -mr-6 px-6">
                    <ul className="divide-y divide-border">
                      {cartItems.map((item) => (
                        <li key={item.id} className="flex py-4">
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-border">
                            <Image src={item.image} alt={item.name} width={96} height={96} className="h-full w-full object-cover object-center" />
                          </div>
                          <div className="ml-4 flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-foreground">
                                <h3>{item.name}</h3>
                                <p className="ml-4">Rs {item.price.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <div className="flex items-center border border-border rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                              </div>
                              <div className="flex">
                                <Button variant="ghost" type="button" onClick={() => removeFromCart(item.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-border p-6">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between text-base font-medium text-foreground">
                        <p>Subtotal</p>
                        <p>Rs {cartTotal.toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Free delivery all across Pakistan</p>
                      <SheetClose asChild>
                        <Button asChild className="w-full"><Link href="/checkout">Checkout</Link></Button>
                      </SheetClose>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Add items from the products page to get started.</p>
                  <SheetClose asChild>
                    <Button asChild className="mt-6">
                      <Link href="/products">Go to Products</Link>
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
                    <Button variant="ghost" asChild>
                        <Link href="/login" className="font-semibold">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup" className="font-semibold">Sign Up</Link>
                    </Button>
                </>
            )}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="p-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg"
                  >
                    <span className="font-headline font-bold">BERRETO</span>
                  </Link>
                </div>
                <nav className="grid gap-6 p-6 text-lg font-semibold">
                  <Link href="/" className="font-medium text-muted-foreground hover:text-foreground">Home</Link>
                  <Link href="/about" className="font-medium text-muted-foreground hover:text-foreground">About Us</Link>
                  <Link href="/agent" className="font-medium text-muted-foreground hover:text-foreground">DIFAE AI Agent</Link>
                  <Link href="/products" className="font-medium text-muted-foreground hover:text-foreground">Products</Link>
                  <Link href="/pre-booking" className="font-medium text-muted-foreground hover:text-foreground">Pre-Bookings</Link>
                  <Link href="/contact" className="font-medium text-muted-foreground hover:text-foreground">Contact Us</Link>
                  <hr className="my-2 border-border" />
                  {user ? (
                     <>
                        <SheetClose asChild>
                          <Link href="/dashboard" className="font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
                        </SheetClose>
                        <Button onClick={() => {
                          // Handle signout logic here
                        }} variant="ghost" className="justify-start font-medium text-muted-foreground hover:text-foreground w-full p-0 text-lg">Log Out</Button>
                    </>
                  ) : (
                    <>
                        <SheetClose asChild>
                          <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground">Login</Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/signup" className="font-medium text-muted-foreground hover:text-foreground">Sign Up</Link>
                        </SheetClose>
                    </>
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