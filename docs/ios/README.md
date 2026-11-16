# Connexio iOS — publication preparation

Current project: Expo SDK ~54, React Native 0.81.5; app.json declares iOS bundle identifier `br.com.connexio.app`.

The unsigned iOS JavaScript export is a preliminary build check, **not** an iOS app binary, IPA or TestFlight upload.

## Release gates

- [ ] Verify the actual published Google Play package and ownership.
- [ ] Validate unique bundle ID within the Apple Developer team.
- [ ] Validate navigation, sign-in, user data deletion, privacy notice, accessibility and iPhone/iPad screenshots.
- [ ] Run native Expo prebuild and unsigned iOS Xcode simulator build on macOS.
- [ ] Verify launch and essential workflows on simulator and real device.
- [ ] Resolve Apple organization membership, distribution certificate and App Store Connect app.
- [ ] Archive signed device build and distribute via TestFlight only after consent and checks.
- [ ] Prepare App Store reviewer login, metadata, permissions, privacy answers, support URLs, and submission.

Keep Android and production unchanged. No Apple submission has been made.

## Verified previous native CI and updated identity gate — 16/11/2026

The native iOS workflow [#42884512113](https://github.com/HenriqueGuilhermeUx/connexio/actions/runs/42884512113) has already **completed successfully** on the previous draft head, as has [JS preflight #42884512136](https://github.com/HenriqueGuilhermeUx/connexio/actions/runs/42884512136). The release checklist entry above for macOS build is therefore historically satisfied for that commit; it must not be mistaken for completion of functional QA or an Apple distribution build.

Commit `915f8ee` adds preflight checks in the compiled iOS simulator app for the expected `CFBundleIdentifier=br.com.connexio.app` and `UIDeviceFamily` including iPad (because `app.json` declares `supportsTablet: true`). This does not test UI/layout on an iPad device or validate the Play package. Await an explicit green workflow on this commit before marking the new checks as verified.

Required next gates: compare commercial Android Play listing and AAB, confirm ownership in Apple Developer, review login/account deletion/support/privacy, test the actual application flows on iPhone and iPad, then signing and TestFlight separately. No merge, production update or Apple submission authorized in this stage.
