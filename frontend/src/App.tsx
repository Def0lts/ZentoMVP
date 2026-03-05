import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Salons from "./pages/Salons";
import SalonDetails from "./pages/SalonDetails";
import Booking from "./pages/Booking";
import Confirm from "./pages/Confirm";
import Success from "./pages/Success";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import About from "./pages/About";

import ChooseMaster from "./pages/ChooseMaster";

import MasterProfile from "./pages/master/MasterProfile";
import MasterActivate from "./pages/master/MasterActivate";
import MasterRequests from "./pages/master/MasterRequests";
import MasterSchedule from "./pages/master/MasterSchedule";
import BookingTime from "./pages/BookingTime";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking/:salonId/time" element={<BookingTime />} />

      <Route path="/salons" element={<Salons />} />
      <Route path="/salons/:salonId" element={<SalonDetails />} />
      <Route path="/salons/:salonId/masters" element={<ChooseMaster />} />

      <Route path="/booking/:salonId" element={<Booking />} />
      <Route path="/confirm" element={<Confirm />} />
      <Route path="/success" element={<Success />} />

      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/support" element={<Support />} />
      <Route path="/about" element={<About />} />

      <Route path="/master" element={<MasterProfile />} />
      <Route path="/master/activate" element={<MasterActivate />} />
      <Route path="/master/requests" element={<MasterRequests />} />
      <Route path="/master/schedule" element={<MasterSchedule />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
