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
