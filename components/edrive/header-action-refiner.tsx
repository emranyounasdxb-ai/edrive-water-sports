'use client';

import { useEffect } from 'react';

function setVisibleText(element: Element, label: string) {
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = label;
}

function setBookingButtonRest(button: HTMLElement) {
  button.style.background = 'linear-gradient(180deg, rgba(255,250,234,0.98) 0%, rgba(245,224,166,0.96) 48%, rgba(221,181,91,0.96) 100%)';
  button.style.borderColor = 'rgba(184, 137, 43, 0.36)';
  button.style.color = '#082532';
  button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -7px 12px rgba(120,82,18,0.08), 0 6px 14px rgba(112,78,22,0.11)';
  button.style.transform = 'translateY(0)';
}

function setBookingButtonHover(button: HTMLElement) {
  button.style.background = 'linear-gradient(180deg, rgba(255,246,218,1) 0%, rgba(240,211,133,0.98) 48%, rgba(205,156,55,0.98) 100%)';
  button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -8px 13px rgba(112,73,13,0.10), 0 9px 19px rgba(112,78,22,0.16)';
  button.style.transform = 'translateY(-1px)';
}

function applyPageOffset() {
  const main = document.querySelector<HTMLElement>('main');
  if (!main) return;
  main.style.paddingTop = '84px';
}

function applyHeaderActions() {
  applyPageOffset();

  document.querySelectorAll<HTMLElement>('header button').forEach((button) => {
    const text = button.textContent?.trim() || '';
    if (text !== 'Check Status' && text !== 'Track Booking') return;

    setVisibleText(button, 'Track Booking');
    button.setAttribute('aria-label', 'Track booking status by reference number');
    button.style.transition = 'background 220ms ease, box-shadow 220ms ease, transform 220ms ease, color 220ms ease';
    setBookingButtonRest(button);
    button.onmouseenter = () => setBookingButtonHover(button);
    button.onmouseleave = () => setBookingButtonRest(button);
  });

  document.querySelectorAll<HTMLElement>('header a[href="/admin"]').forEach((anchor) => {
    const text = anchor.textContent?.trim() || '';
    if (text !== 'Admin Portal' && text !== 'Staff Login') return;
    setVisibleText(anchor, 'Staff Login');
  });
}

export function HeaderActionRefiner() {
  useEffect(() => {
    applyHeaderActions();
    const timeout = window.setTimeout(applyHeaderActions, 650);
    const observer = new MutationObserver(applyHeaderActions);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return null;
}
