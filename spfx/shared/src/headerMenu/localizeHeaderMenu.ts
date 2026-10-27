import type { IHeaderMenuLink, IHeaderMenuSection, LocalizedText } from './IHeaderMenu';

const IMAGE_DATA_URI = /^data:image\/(png|jpe?g|gif|svg\+xml|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Text for a locale: an exact match ("fr-ca"), then the language ("fr"), then another region of the
 * language ("fr-fr"), then "default".  Locale keys are case-insensitive.  Undefined when not usable text.
 */
export function resolveLocalizedText(text: LocalizedText | unknown, locale: string | undefined): string | undefined {
  if (typeof text === 'string') {
    return text || undefined;
  }
  if (!isObject(text)) {
    return undefined;
  }

  const translations = new Map<string, string>();
  Object.keys(text).forEach((key) => {
    const value = optionalString(text[key]);
    if (value) {
      translations.set(key.toLowerCase(), value);
    }
  });

  const requested = (locale ?? '').toLowerCase();
  const language = requested.split('-')[0];
  const sameLanguage = Array.from(translations.keys()).find((key) => language && key.startsWith(`${language}-`));

  return (
    translations.get(requested) ??
    translations.get(language) ??
    (sameLanguage ? translations.get(sameLanguage) : undefined) ??
    translations.get('default')
  );
}

function toSection(value: unknown, locale: string | undefined): IHeaderMenuSection | undefined {
  if (!isObject(value) || !optionalString(value.key) || !Array.isArray(value.links)) {
    return undefined;
  }
  return {
    key: value.key as string,
    title: resolveLocalizedText(value.title, locale),
    links: toLinks(value.links, locale)
  };
}

function toLink(value: unknown, locale: string | undefined): IHeaderMenuLink | undefined {
  const text = isObject(value) ? resolveLocalizedText(value.text, locale) : undefined;
  if (!isObject(value) || !optionalString(value.key) || !text) {
    return undefined;
  }

  const image = optionalString(value.image);
  const sections = Array.isArray(value.sections)
    ? value.sections
      .map((section) => toSection(section, locale))
      .filter((section): section is IHeaderMenuSection => !!section)
    : [];

  return {
    key: value.key as string,
    text,
    iconName: optionalString(value.iconName),
    image: image && IMAGE_DATA_URI.test(image) ? image : undefined,
    href: optionalString(value.href),
    openInNewTab: value.openInNewTab === true || undefined,
    sections: sections.length ? sections : undefined
  };
}

function toLinks(values: unknown[], locale: string | undefined): IHeaderMenuLink[] {
  return values
    .map((value) => toLink(value, locale))
    .filter((link): link is IHeaderMenuLink => !!link);
}

/**
 * Header commands from menu JSON (IHeaderMenuDefinition), with text for the locale.  The JSON is edited
 * by hand, so it is checked as it is read: entries without a key or text are left out, and images that
 * are not base64 image data URIs are ignored.
 */
export function localizeHeaderMenu(menu: unknown, locale: string | undefined): IHeaderMenuLink[] {
  return isObject(menu) && Array.isArray(menu.commands) ? toLinks(menu.commands, locale) : [];
}
