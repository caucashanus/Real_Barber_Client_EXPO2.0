module.exports = {
  type: 'widget',
  // Must differ from main app productName (RealBarber) — same value breaks apple-targets on re-prebuild.
  name: 'RealBarberWidget',
  displayName: 'Real Barber',
  deploymentTarget: '16.2',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.realbarber.client'],
  },
};
