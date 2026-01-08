"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import GoogleAddressSearch from "./GoogleAddressSearch";
import { Button } from "@/components/ui/button";
import FilterSection from "./FilterSection";
import PropertyCard from "./PropertyCard";

function Listing({
  listing,
  handleSearchClick,
  searchedAddress,
  setBathCount,
  setBedCount,
  setParkingCount,
  setHomeType,
  setCoordinates,
  setAvailability,
  setSortBy,
  columns = 3,
  hoveredListingId,
  setHoveredListingId,
  isMapExpanded,
}) {
  const [address, setAddress] = useState();
  const [bedCount, setBedCountLocal] = useState();
  const [bathCount, setBathCountLocal] = useState();
  const [homeType, setHomeTypeLocal] = useState();
  const [availability, setAvailabilityLocal] = useState("");
  const [sortBy, setSortByLocal] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(4);

  const [filteredData, setFilteredData] = useState(listing);
  const cardRefs = useRef({});

  const handleSearch = async () => {
    setIsLoading(true);
    if (typeof handleSearchClick === "function") {
      await handleSearchClick();
    }
    setIsLoading(false);
  };

  const handleClearAllFilters = async () => {
    setBedCount(undefined);
    setBedCountLocal(undefined);
    setBathCount(undefined);
    setBathCountLocal(undefined);
    setParkingCount(undefined);
    setHomeType(undefined);
    setHomeTypeLocal(undefined);
    setAvailability("");
    setAvailabilityLocal("");
    setSortBy(undefined);
    setSortByLocal(undefined);
    await handleSearch();
  };

  useEffect(() => {
    const updateSkeletonCount = () => {
      setSkeletonCount(window.innerWidth < 768 ? 2 : 4);
    };
    updateSkeletonCount();
    window.addEventListener("resize", updateSkeletonCount);
    return () => window.removeEventListener("resize", updateSkeletonCount);
  }, []);

  return (
    <div>
      <div
        className={`transition-all duration-300 ${
          isMapExpanded
            ? "fixed left-0 right-0 top-[64px] z-[100] bg-white shadow-md"
            : "relative"
        }`}
      >
        {isMapExpanded ? (
          <div className="flex w-full flex-wrap items-end gap-2 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-[250px] flex-grow md:max-w-[500px]">
              <GoogleAddressSearch
                selectedAddress={(v) => {
                  searchedAddress(v);
                  setAddress(v);
                }}
                setCoordinates={setCoordinates}
              />
            </div>
            <div>
              <Button
                className="h-[42px]"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? "Loading..." : ""}
              </Button>
            </div>
            <div className="flex flex-1 flex-wrap items-end gap-2 md:flex-nowrap md:justify-start md:gap-2">
              <FilterSection
                data={listing}
                setFilteredData={setFilteredData}
                bedCount={bedCount}
                setBedCount={(v) => {
                  setBedCount(v);
                  setBedCountLocal(v);
                }}
                bathCount={bathCount}
                setBathCount={(v) => {
                  setBathCount(v);
                  setBathCountLocal(v);
                }}
                homeType={homeType}
                setHomeType={(v) => {
                  setHomeType(v);
                  setHomeTypeLocal(v);
                }}
                availability={availability}
                setAvailability={(v) => {
                  setAvailability(v);
                  setAvailabilityLocal(v);
                }}
                sortBy={sortBy}
                setSortBy={(v) => {
                  setSortBy(v);
                  setSortByLocal(v);
                }}
                onClearAll={handleClearAllFilters}
                compact={false}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="pb-4">
              <div className="grid grid-cols-6 items-end gap-2">
                <div className="col-span-5">
                  <div className="h-[42px]">
                    <GoogleAddressSearch
                      selectedAddress={(v) => {
                        searchedAddress(v);
                        setAddress(v);
                      }}
                      setCoordinates={setCoordinates}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    className="h-[42px] w-full gap-2"
                    onClick={handleSearch}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {isLoading ? "Loading..." : ""}
                  </Button>
                </div>
              </div>
            </div>

            <FilterSection
              data={listing}
              setFilteredData={setFilteredData}
              bedCount={bedCount}
              setBedCount={(v) => {
                setBedCount(v);
                setBedCountLocal(v);
              }}
              bathCount={bathCount}
              setBathCount={(v) => {
                setBathCount(v);
                setBathCountLocal(v);
              }}
              homeType={homeType}
              setHomeType={(v) => {
                setHomeType(v);
                setHomeTypeLocal(v);
              }}
              availability={availability}
              setAvailability={(v) => {
                setAvailability(v);
                setAvailabilityLocal(v);
              }}
              sortBy={sortBy}
              setSortBy={(v) => {
                setSortBy(v);
                setSortByLocal(v);
              }}
              onClearAll={handleClearAllFilters}
              compact={true}
            />
          </>
        )}
      </div>

      <div className="my-5 px-8">
        <h2 className="text-xl">
          Showing <span className="font-bold">{filteredData?.length}</span>{" "}
          properties
          {address?.label && (
            <>
              {" "}
              in <span className="font-bold text-primary">{address.label}</span>
            </>
          )}
        </h2>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          columns === 3
            ? "md:grid-cols-3"
            : columns === 6
            ? "md:grid-cols-6"
            : "md:grid-cols-2"
        } gap-6 pl-8 pr-4`}
      >
        {isLoading ? (
          [...Array(skeletonCount)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse space-y-3 rounded-2xl border bg-white p-4 shadow"
            >
              <div className="h-[170px] w-full rounded-xl bg-gray-300"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-100"></div>
              <div className="mt-2 flex gap-2">
                <div className="h-8 w-1/3 rounded-md bg-gray-200"></div>
                <div className="h-8 w-1/3 rounded-md bg-gray-200"></div>
                <div className="h-8 w-1/3 rounded-md bg-gray-200"></div>
              </div>
            </div>
          ))
        ) : filteredData?.length > 0 ? (
          filteredData.map((item) => (
            <PropertyCard
              key={item.id}
              item={item}
              hoveredListingId={hoveredListingId}
              onHover={(id) => setHoveredListingId?.(id)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg">
              No properties found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Listing;
