"use client";

import { Search as MagnifyingGlass, X } from "lucide-react";
import type { RefObject } from "react";

type SearchInputProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name: string;
  label: string;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
};

/**
 * Single shared search field for the whole workspace.
 * 44px height, icon left, clear button only when there is text.
 * Controlled when `value`+`onChange` are given, uncontrolled otherwise.
 */
export function SearchInput({
  value,
  defaultValue,
  onChange,
  name,
  label,
  placeholder,
  inputRef,
  autoFocus,
}: SearchInputProps) {
  const controlled = value !== undefined;
  const clear = () => {
    onChange?.("");
    inputRef?.current?.focus();
  };
  return (
    <label className="search-input">
      <MagnifyingGlass aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
      <input
        ref={inputRef}
        name={name}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder={placeholder}
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue })}
      />
      {controlled && value ? (
        <button type="button" className="clear-search" aria-label={`Clear ${label}`} onClick={clear}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}
