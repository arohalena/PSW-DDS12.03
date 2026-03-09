import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import EventsList from "../pages/EventsList";
import CreateEvent from "../pages/CreateEvent";
import Navbar from "../components/Navbar";

function Layout() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<EventsList />} />
          <Route path="/eventos/nuevo" element={<CreateEvent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}