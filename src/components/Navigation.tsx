import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { NotificationButton } from './notifications/NotificationButton';

export const Navigation = () => {
  const { session, signOut } = useAuth();
  const { sellerProfile, isLoading } = useSellerProfile(session);

  return (
    <nav className="bg-white fixed w-full z-20 top-0 start-0 shadow-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="/logo.svg" className="h-8" alt="Flowbite Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-[#222020]">
            Auto Auction
          </span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex-1 flex items-center justify-center">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <Link to="/" className="block py-2 px-3 text-[#222020] rounded md:bg-transparent md:text-[#4B4DED] md:p-0 dark:text-white md:dark:text-blue-500" aria-current="page">
                Home
              </Link>
            </li>
            <li>
              <Link to="/auctions" className="block py-2 px-3 text-[#222020] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#4B4DED] md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">
                Auctions
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="block py-2 px-3 text-[#222020] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#4B4DED] md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/contact" className="block py-2 px-3 text-[#222020] rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#4B4DED] md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Auth Buttons or User Menu */}
        <div className="flex items-center space-x-4">
          {/* Insert NotificationButton before the user menu or auth buttons */}
          {session && (
            <NotificationButton />
          )}
          
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sellerProfile?.profile_picture || session?.user?.user_metadata?.avatar_url} alt={session.user.email || "User"} />
                    <AvatarFallback>{session.user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link to="/profile" className="w-full h-full block">
                    Profile
                  </Link>
                </DropdownMenuItem>
                {sellerProfile?.is_verified && (
                  <DropdownMenuItem>
                    <Link to="/seller-dashboard" className="w-full h-full block">
                      Seller Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
