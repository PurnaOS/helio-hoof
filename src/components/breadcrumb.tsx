"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  segments: {
    title: string
    href?: string
  }[]
  separator?: React.ReactNode
  homeHref?: string
}

export function Breadcrumb({
  segments,
  separator = <ChevronRight className="h-4 w-4" />,
  homeHref = "/",
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center text-sm", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5">
        <li className="flex items-center">
          <Link
            href={homeHref}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLastItem = index === segments.length - 1
          
          return (
            <React.Fragment key={segment.title}>
              <li className="flex items-center text-muted-foreground">
                {separator}
              </li>
              <li className="flex items-center">
                {isLastItem || !segment.href ? (
                  <span className={cn(isLastItem ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {segment.title}
                  </span>
                ) : (
                  <Link
                    href={segment.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {segment.title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
