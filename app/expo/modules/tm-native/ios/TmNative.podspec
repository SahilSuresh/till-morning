Pod::Spec.new do |s|
  s.name           = 'TmNative'
  s.version        = '1.0.0'
  s.summary        = 'Till Morning native helpers: app labels, per-app selections, on-device text recognition'
  s.description    = 'Till Morning native helpers'
  s.author         = ''
  s.homepage       = 'https://example.com'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.swift_version  = '5.9'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
