import { makeDir, makeFile, insertNode, type DirNode } from './tree';
import { uuid } from '@/lib/uuid';

const README = `Welcome to my Windows 95!

This is a personal-website facsimile of Windows 95, built by Jared Raiola.

Try opening Notepad from the Start menu, or double-click "My Computer" on the
desktop to browse this filesystem. Anything you save here lives in your own
browser — nothing is sent anywhere.

Have fun looking around.`;

const ABOUT_ME = `About Me
========

Hi, I'm Jared. Welcome to my corner of the web — built to look like 1995
because the future was more fun before everything was a Single Page App.

Find more on the desktop: GitHub, LinkedIn, and my resume.`;

export function buildSeedTree(): DirNode {
  const now = Date.now();
  const root = makeDir('C:', now);

  // Top level: only Program Files and Windows.
  insertNode(root, 'C:\\Program Files', makeDir('Program Files', now));
  insertNode(root, 'C:\\Windows', makeDir('Windows', now));
  insertNode(root, 'C:\\Windows\\System', makeDir('System', now));
  insertNode(root, 'C:\\Windows\\User', makeDir('User', now));
  insertNode(root, 'C:\\Windows\\User\\Desktop', makeDir('Desktop', now));
  insertNode(root, 'C:\\Windows\\User\\My Documents', makeDir('My Documents', now));
  insertNode(root, 'C:\\Windows\\User\\My Documents\\Projects', makeDir('Projects', now));
  insertNode(root, 'C:\\Windows\\User\\Recycle Bin', makeDir('Recycle Bin', now));

  const readmeBlob = uuid();
  insertNode(
    root,
    'C:\\Windows\\User\\Desktop\\README.txt',
    makeFile('README.txt', 'text/plain', README.length, readmeBlob, now),
  );

  const aboutBlob = uuid();
  insertNode(
    root,
    'C:\\Windows\\User\\My Documents\\About Me.txt',
    makeFile('About Me.txt', 'text/plain', ABOUT_ME.length, aboutBlob, now),
  );

  return root;
}

export const SEED_BLOBS: Record<string, { content: string; mime: string }> = {};
export const SEED_TEXT = { README, ABOUT_ME };
