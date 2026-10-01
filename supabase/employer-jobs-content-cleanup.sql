-- Rewrites the 13 live employer listings into the standard intake format.
-- Run supabase/employer-jobs-intake-migration.sql first. Safe to re-run.

BEGIN;

-- Task Manager – Containment Tendon Surveillance
UPDATE public.employer_jobs SET
  title = $q$Task Manager – Containment Tendon Surveillance$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$calvert-cliffs$q$,
  location = $q$Lusby, MD$q$,
  state = $q$maryland$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Manage the vendor contractor crews performing tendon surveillance on both containment structures at Calvert Cliffs. You'll run the vendor-to-site interface: coordinating work around both containments and keeping support tasks on schedule so the surveillance isn't delayed. This is a 16-week assignment.","responsibilities":"- Coordinate MMD priorities\n- Set up RP air sampling\n- Prepare and approve confined space paperwork daily\n- Make sure material is ordered and arrives when needed\n- Ensure environmental and chemistry procedures are followed\n- Coordinate material staging with other plant activities\n- Write IRs for non-technical issues and coordinate scaffold packages\n- Develop and implement JHAs and confined space rescue plans\n- Coordinate cleaning services\n- Make sure power needs are met, including lighting and TPUs\n- Attend daily shift meetings and PSC briefings and pass on key information\n- Make sure PSC is paid on schedule\n- Mediate disagreements between PSC and plant crews\n- Keep support tasks on schedule to prevent delays","qualifications":"- Bachelor's degree\n- 3+ years of relevant utility experience (transmission, distribution, gas or substation)\n- Previous nuclear experience","location_details":"Start: May 31, 2027\nEnd: September 17, 2027\nSchedule: 10-hour days, 5 days a week, for 16 weeks","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Manage the vendor contractor crews performing tendon surveillance on both containment structures at Calvert Cliffs. You'll run the vendor-to-site interface: coordinating work around both containments and keeping support tasks on schedule so the surveillance isn't delayed. This is a 16-week assignment.

Responsibilities
- Coordinate MMD priorities
- Set up RP air sampling
- Prepare and approve confined space paperwork daily
- Make sure material is ordered and arrives when needed
- Ensure environmental and chemistry procedures are followed
- Coordinate material staging with other plant activities
- Write IRs for non-technical issues and coordinate scaffold packages
- Develop and implement JHAs and confined space rescue plans
- Coordinate cleaning services
- Make sure power needs are met, including lighting and TPUs
- Attend daily shift meetings and PSC briefings and pass on key information
- Make sure PSC is paid on schedule
- Mediate disagreements between PSC and plant crews
- Keep support tasks on schedule to prevent delays

Qualifications
- Bachelor's degree
- 3+ years of relevant utility experience (transmission, distribution, gas or substation)
- Previous nuclear experience

Schedule and Duration
Start: May 31, 2027
End: September 17, 2027
Schedule: 10-hour days, 5 days a week, for 16 weeks

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = 'ca50839d-eee1-4cc8-b82c-f9a7952ad609';

-- Electrical Design Engineer
UPDATE public.employer_jobs SET
  title = $q$Electrical Design Engineer$q$,
  category = $q$engineering$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$remote$q$,
  plant_id = $q$calvert-cliffs$q$,
  location = $q$Remote$q$,
  state = $q$maryland$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Provide electrical design engineering support to Constellation's Calvert Cliffs design team (CDO) across several plant modification projects. Two of them, the exciter replacement and the U-4000-23 transformer replacement, are fast-tracked for the CC2R27 refueling outage, so the role starts as soon as possible. You'll also mentor a newer CDO engineer through the design work.","responsibilities":"- Provide electrical design support for CDO projects: SWCA/Purate modifications, exciter replacement, U-4000 series transformer replacement, RPS, and potentially PPC/DAS\n- Support design development and coordinate with site engineering and vendors on execution, configuration control and outage schedules\n- Mentor a newer CDO engineer during project design","qualifications":"- Subject-matter expertise in electrical design for nuclear plant modifications\n- Bachelor's degree or PE license","location_details":"Start: ASAP\nEnd: April 30, 2027\nRemote, supporting Calvert Cliffs (Lusby, MD)","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Provide electrical design engineering support to Constellation's Calvert Cliffs design team (CDO) across several plant modification projects. Two of them, the exciter replacement and the U-4000-23 transformer replacement, are fast-tracked for the CC2R27 refueling outage, so the role starts as soon as possible. You'll also mentor a newer CDO engineer through the design work.

Responsibilities
- Provide electrical design support for CDO projects: SWCA/Purate modifications, exciter replacement, U-4000 series transformer replacement, RPS, and potentially PPC/DAS
- Support design development and coordinate with site engineering and vendors on execution, configuration control and outage schedules
- Mentor a newer CDO engineer during project design

Qualifications
- Subject-matter expertise in electrical design for nuclear plant modifications
- Bachelor's degree or PE license

Schedule and Duration
Start: ASAP
End: April 30, 2027
Remote, supporting Calvert Cliffs (Lusby, MD)

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '6167dced-244f-4d11-8df8-531f4a0291b6';

-- Nuclear Project Engineer – Extended Power Uprate
UPDATE public.employer_jobs SET
  title = $q$Nuclear Project Engineer – Extended Power Uprate$q$,
  category = $q$engineering$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$hybrid$q$,
  plant_id = $q$limerick$q$,
  location = $q$Pottstown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Join the Limerick Extended Power Uprate (EPU) project team, developing engineering documentation, technical evaluations and licensing work for the uprate. NPower is hiring several engineers for this assignment, which runs to the end of the project (estimated 2031).","responsibilities":"- Develop and support engineering documentation for the EPU project\n- Perform technical evaluations\n- Support licensing activities\n- Support other engineering tasks associated with the project","qualifications":"- 10+ years of nuclear engineering experience\n- Bachelor's degree or higher in an engineering field\n- Experience supporting nuclear plant design","desired":"- EPU experience\n- Measurement Uncertainty Recapture (MUR) experience\n- Boiling water reactor experience\n- Experience supporting License Amendment Requests (LARs)\n- Previous Limerick or Constellation experience\n- 10 CFR 50.59 evaluations or screenings","location_details":"Start: November 2, 2026\nEnd: End of project (estimated 2031)\nSchedule: 40 hours a week\nRemote or hybrid considered; candidates able to work on-site at Limerick are preferred","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Join the Limerick Extended Power Uprate (EPU) project team, developing engineering documentation, technical evaluations and licensing work for the uprate. NPower is hiring several engineers for this assignment, which runs to the end of the project (estimated 2031).

Responsibilities
- Develop and support engineering documentation for the EPU project
- Perform technical evaluations
- Support licensing activities
- Support other engineering tasks associated with the project

Qualifications
- 10+ years of nuclear engineering experience
- Bachelor's degree or higher in an engineering field
- Experience supporting nuclear plant design

Desired
- EPU experience
- Measurement Uncertainty Recapture (MUR) experience
- Boiling water reactor experience
- Experience supporting License Amendment Requests (LARs)
- Previous Limerick or Constellation experience
- 10 CFR 50.59 evaluations or screenings

Schedule and Duration
Start: November 2, 2026
End: End of project (estimated 2031)
Schedule: 40 hours a week
Remote or hybrid considered; candidates able to work on-site at Limerick are preferred

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '6122d709-7d5c-4f6b-84b7-2d41e52600a7';

-- Senior Project Manager – Extended Power Uprate
UPDATE public.employer_jobs SET
  title = $q$Senior Project Manager – Extended Power Uprate$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$limerick$q$,
  location = $q$Pottstown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"NPower is hiring two to three project managers for the Limerick Extended Power Uprate (EPU) project as the effort ramps up. You'll support project execution and coordination across the site. Candidates need enough nuclear industry experience to step in with minimal ramp-up.","responsibilities":"- Support planning and execution of EPU project activities\n- Coordinate across engineering, construction, operations, vendors and project stakeholders\n- Manage project scope, schedule, cost, risks and deliverables\n- Track project performance and give clear status updates to leadership\n- Identify and resolve issues that could affect execution\n- Keep project teams and key stakeholders aligned\n- Make sure work follows applicable nuclear standards, procedures and project requirements","qualifications":"- Current PMP certification\n- 10+ years in nuclear project management\n- Experience supporting nuclear plant projects, modifications, uprates or major capital projects\n- Strong communication, organization and stakeholder-management skills\n- Able to manage multiple priorities in a complex project environment\n- Able to start with limited onboarding or training\n- Able to work in office and plant environments, including walking plant areas and climbing stairs\n- Able to meet site access, security and fitness-for-duty requirements","location_details":"Start: October 2026\nEnd: Based on project needs\nSchedule: Full-time; exact schedule to be confirmed","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
NPower is hiring two to three project managers for the Limerick Extended Power Uprate (EPU) project as the effort ramps up. You'll support project execution and coordination across the site. Candidates need enough nuclear industry experience to step in with minimal ramp-up.

Responsibilities
- Support planning and execution of EPU project activities
- Coordinate across engineering, construction, operations, vendors and project stakeholders
- Manage project scope, schedule, cost, risks and deliverables
- Track project performance and give clear status updates to leadership
- Identify and resolve issues that could affect execution
- Keep project teams and key stakeholders aligned
- Make sure work follows applicable nuclear standards, procedures and project requirements

Qualifications
- Current PMP certification
- 10+ years in nuclear project management
- Experience supporting nuclear plant projects, modifications, uprates or major capital projects
- Strong communication, organization and stakeholder-management skills
- Able to manage multiple priorities in a complex project environment
- Able to start with limited onboarding or training
- Able to work in office and plant environments, including walking plant areas and climbing stairs
- Able to meet site access, security and fitness-for-duty requirements

Schedule and Duration
Start: October 2026
End: Based on project needs
Schedule: Full-time; exact schedule to be confirmed

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '86cc6091-9a50-4b54-a3d9-c594010bc1ce';

-- Maintenance Project Manager
UPDATE public.employer_jobs SET
  title = $q$Maintenance Project Manager$q$,
  category = $q$maintenance$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$three-mile-island$q$,
  location = $q$Middletown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Lead a key maintenance project at Crane Clean Energy Center (formerly Three Mile Island) through spring 2027, as part of the plant's restart. The work is in the Reactor Building and other radiological areas. You'll need a strong nuclear maintenance background and a record of taking projects from planning through closeout across multiple site organizations.","responsibilities":"- Lead assigned maintenance and project activities from planning through execution and closeout\n- Drive project schedules, milestones, priorities and deliverables\n- Support planning and execution of work in the Reactor Building and radiological areas\n- Identify and resolve issues that could affect schedule or execution\n- Give site leadership clear, timely status updates\n- Make sure work follows site procedures, nuclear standards and safety expectations","qualifications":"- Previous nuclear project manager, maintenance manager or comparable maintenance leadership experience\n- Experience leading projects through completion\n- Experience coordinating multiple site organizations to execute complex work\n- Strong leadership, communication, organization and problem-solving skills\n- Able to work in radiologically controlled areas, walk the site, climb stairs and meet site access, fitness-for-duty and radiation protection requirements","desired":"- Project experience in a Reactor Building or radiological areas of a commercial nuclear plant\n- Experience leading projects at a Constellation nuclear plant\n- Familiarity with Crane Clean Energy Center / Three Mile Island processes and site expectations","location_details":"Duration: Through spring 2027\nOn-site, including radiologically controlled areas","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Lead a key maintenance project at Crane Clean Energy Center (formerly Three Mile Island) through spring 2027, as part of the plant's restart. The work is in the Reactor Building and other radiological areas. You'll need a strong nuclear maintenance background and a record of taking projects from planning through closeout across multiple site organizations.

Responsibilities
- Lead assigned maintenance and project activities from planning through execution and closeout
- Drive project schedules, milestones, priorities and deliverables
- Support planning and execution of work in the Reactor Building and radiological areas
- Identify and resolve issues that could affect schedule or execution
- Give site leadership clear, timely status updates
- Make sure work follows site procedures, nuclear standards and safety expectations

Qualifications
- Previous nuclear project manager, maintenance manager or comparable maintenance leadership experience
- Experience leading projects through completion
- Experience coordinating multiple site organizations to execute complex work
- Strong leadership, communication, organization and problem-solving skills
- Able to work in radiologically controlled areas, walk the site, climb stairs and meet site access, fitness-for-duty and radiation protection requirements

Desired
- Project experience in a Reactor Building or radiological areas of a commercial nuclear plant
- Experience leading projects at a Constellation nuclear plant
- Familiarity with Crane Clean Energy Center / Three Mile Island processes and site expectations

Schedule and Duration
Duration: Through spring 2027
On-site, including radiologically controlled areas

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '3e5860bf-1528-4a29-9df7-93e6ca01b04e';

-- Electrical Design Engineer
UPDATE public.employer_jobs SET
  title = $q$Electrical Design Engineer$q$,
  category = $q$engineering$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$remote$q$,
  plant_id = $q$lasalle$q$,
  location = $q$Remote$q$,
  state = $q$illinois$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Provide electrical design engineering support to LaSalle Clean Energy Center across several projects, working remotely with monthly trips to site. You'll coordinate with site engineering and vendors and mentor newer engineers during project design. The assignment runs through 2028, with a possible extension.","responsibilities":"- Support design development across multiple plant projects\n- Coordinate with site engineering and vendors on execution, configuration control and outage schedules\n- Mentor newer engineers during project design","qualifications":"- Bachelor's degree or PE license","desired":"- Prior nuclear experience","location_details":"Start: ASAP\nEnd: December 31, 2028, with possible extension\nRemote, with monthly trips to LaSalle (Marseilles, IL)","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Provide electrical design engineering support to LaSalle Clean Energy Center across several projects, working remotely with monthly trips to site. You'll coordinate with site engineering and vendors and mentor newer engineers during project design. The assignment runs through 2028, with a possible extension.

Responsibilities
- Support design development across multiple plant projects
- Coordinate with site engineering and vendors on execution, configuration control and outage schedules
- Mentor newer engineers during project design

Qualifications
- Bachelor's degree or PE license

Desired
- Prior nuclear experience

Schedule and Duration
Start: ASAP
End: December 31, 2028, with possible extension
Remote, with monthly trips to LaSalle (Marseilles, IL)

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '7b7a57af-876b-4df7-b06b-cb570a3b8290';

-- I&C Design Engineer
UPDATE public.employer_jobs SET
  title = $q$I&C Design Engineer$q$,
  category = $q$engineering$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$remote$q$,
  plant_id = $q$lasalle$q$,
  location = $q$Remote$q$,
  state = $q$illinois$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Develop I&C design packages for plant modifications at LaSalle Clean Energy Center, working remotely with monthly trips to site. The work covers design, engineering evaluations and analysis, plus support through field walkdowns, testing, commissioning and refueling outages. The assignment runs through 2028, with a possible extension.","responsibilities":"- Develop engineering design packages for I&C system modifications\n- Perform engineering evaluations and technical analyses for plant modifications and operational improvements\n- Support field walkdowns, design verification, testing, commissioning and refueling outage work\n- Provide technical support during implementation and resolve design issues","qualifications":"- Bachelor's degree in engineering (electrical, instrumentation, controls, nuclear or related)\n- I&C design engineering experience at a commercial nuclear power plant\n- Able to interpret engineering drawings, specifications and technical documentation\n- Able to develop and review control system design packages","desired":"- PE license","location_details":"Start: ASAP\nEnd: December 31, 2028, with possible extension\nRemote, with monthly trips to LaSalle (Marseilles, IL)","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Develop I&C design packages for plant modifications at LaSalle Clean Energy Center, working remotely with monthly trips to site. The work covers design, engineering evaluations and analysis, plus support through field walkdowns, testing, commissioning and refueling outages. The assignment runs through 2028, with a possible extension.

Responsibilities
- Develop engineering design packages for I&C system modifications
- Perform engineering evaluations and technical analyses for plant modifications and operational improvements
- Support field walkdowns, design verification, testing, commissioning and refueling outage work
- Provide technical support during implementation and resolve design issues

Qualifications
- Bachelor's degree in engineering (electrical, instrumentation, controls, nuclear or related)
- I&C design engineering experience at a commercial nuclear power plant
- Able to interpret engineering drawings, specifications and technical documentation
- Able to develop and review control system design packages

Desired
- PE license

Schedule and Duration
Start: ASAP
End: December 31, 2028, with possible extension
Remote, with monthly trips to LaSalle (Marseilles, IL)

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$StaffAug@npwrsolutions.com$q$
WHERE id = '4c8fba1d-046b-47b5-9edb-2fd4b3f88789';

-- Project Scheduler – Dry Cask Storage
UPDATE public.employer_jobs SET
  title = $q$Project Scheduler – Dry Cask Storage$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$clinton$q$,
  location = $q$Clinton, IL$q$,
  state = $q$illinois$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"Run the Primavera P6 schedule for the dry cask storage campaign at Clinton. You'll adjust the schedule, communicate changes to the site, and attend all schedule meetings in person.","responsibilities":"- Adjust and maintain the campaign schedule in P6\n- Communicate schedule changes to site teams\n- Attend all schedule meetings in person","qualifications":"- Asset Suite 9 experience\n- Primavera P6/P3, Microsoft Project and Excel\n- Strong communication skills","location_details":"Schedule: Monday to Friday, day shift, 10–12 hour days\nOn-site at Clinton","what_we_offer":"- Medical, dental and vision insurance\n- Retirement savings plan with company match\n- Group-rate life and disability insurance\n- Employee assistance and wellness programs"}$q$::jsonb,
  description = $q$About this Role
Run the Primavera P6 schedule for the dry cask storage campaign at Clinton. You'll adjust the schedule, communicate changes to the site, and attend all schedule meetings in person.

Responsibilities
- Adjust and maintain the campaign schedule in P6
- Communicate schedule changes to site teams
- Attend all schedule meetings in person

Qualifications
- Asset Suite 9 experience
- Primavera P6/P3, Microsoft Project and Excel
- Strong communication skills

Schedule and Duration
Schedule: Monday to Friday, day shift, 10–12 hour days
On-site at Clinton

What We Offer
- Medical, dental and vision insurance
- Retirement savings plan with company match
- Group-rate life and disability insurance
- Employee assistance and wellness programs$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$staffaug@npwrsolutions.com$q$
WHERE id = 'ac90f54e-22b7-4449-9ac0-8431887b2250';

-- Project Manager – Extended Power Uprate
UPDATE public.employer_jobs SET
  title = $q$Project Manager – Extended Power Uprate$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$limerick$q$,
  location = $q$Pottstown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = 90,
  salary_max = 120,
  salary_period = $q$hour$q$,
  structured_description = $q${"about":"Allied Power is hiring two to three project managers for the Limerick Extended Power Uprate (EPU) project as the effort ramps up. Candidates need prior nuclear industry experience and should be able to step in with minimal ramp-up.","responsibilities":"- Support planning and execution of EPU project activities\n- Coordinate across engineering, construction, operations, vendors and project stakeholders\n- Manage project scope, schedule, cost, risks and deliverables\n- Track project performance and give clear status updates to leadership\n- Identify and resolve issues that could affect execution\n- Keep project teams and key stakeholders aligned\n- Make sure work follows applicable nuclear standards, procedures and project requirements","qualifications":"- Current PMP certification\n- Project management experience\n- Experience supporting nuclear plant projects, modifications, uprates or major capital projects\n- Experience working with engineering, construction, operations and vendor organizations\n- Strong communication, organization and stakeholder-management skills\n- Able to manage multiple priorities in a complex project environment\n- Able to start with limited onboarding or training","location_details":"Start: October 2026\nEnd: Based on project needs\nSchedule: Full-time; exact schedule to be confirmed","what_we_offer":"Medical, dental and vision insurance"}$q$::jsonb,
  description = $q$About this Role
Allied Power is hiring two to three project managers for the Limerick Extended Power Uprate (EPU) project as the effort ramps up. Candidates need prior nuclear industry experience and should be able to step in with minimal ramp-up.

Responsibilities
- Support planning and execution of EPU project activities
- Coordinate across engineering, construction, operations, vendors and project stakeholders
- Manage project scope, schedule, cost, risks and deliverables
- Track project performance and give clear status updates to leadership
- Identify and resolve issues that could affect execution
- Keep project teams and key stakeholders aligned
- Make sure work follows applicable nuclear standards, procedures and project requirements

Qualifications
- Current PMP certification
- Project management experience
- Experience supporting nuclear plant projects, modifications, uprates or major capital projects
- Experience working with engineering, construction, operations and vendor organizations
- Strong communication, organization and stakeholder-management skills
- Able to manage multiple priorities in a complex project environment
- Able to start with limited onboarding or training

Schedule and Duration
Start: October 2026
End: Based on project needs
Schedule: Full-time; exact schedule to be confirmed

What We Offer
Medical, dental and vision insurance$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$cbaierski@npwrsolutions.com$q$
WHERE id = 'faad362b-2bc8-4e29-b266-1cf05960b46d';

-- Nuclear Scheduler
UPDATE public.employer_jobs SET
  title = $q$Nuclear Scheduler$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$three-mile-island$q$,
  location = $q$Middletown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = 55,
  salary_max = 75,
  salary_period = $q$hour$q$,
  structured_description = $q${"about":"Build and maintain maintenance, operations and outage schedules at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting as soon as possible.","responsibilities":"- Develop and maintain detailed schedules for planned, forced and refueling outages\n- Build and maintain schedule logic, resources, constraints and work windows\n- Coordinate with planners, engineers, team leads, outage staff and other site organizations\n- Run scheduling meetings and support pre-planning, execution and schedule critiques\n- Identify schedule conflicts, risks and opportunities to improve\n- Develop contingency plans and recommend schedule improvements\n- Keep schedule reports accurate and communicate status across departments","qualifications":"- High school diploma or GED\n- Significant experience building nuclear maintenance, operations or outage schedules\n- Strong knowledge of Critical Path Method scheduling\n- Experience with nuclear scheduling tools\n- Strong communication, organization, problem-solving and computer skills\n- Able to work across departments with competing priorities","desired":"- Commercial nuclear power plant experience","location_details":"Start: ASAP\nDuration: About 2–3 years\nOn-site at Crane Clean Energy Center, Middletown, PA","what_we_offer":"Medical, dental and vision insurance"}$q$::jsonb,
  description = $q$About this Role
Build and maintain maintenance, operations and outage schedules at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting as soon as possible.

Responsibilities
- Develop and maintain detailed schedules for planned, forced and refueling outages
- Build and maintain schedule logic, resources, constraints and work windows
- Coordinate with planners, engineers, team leads, outage staff and other site organizations
- Run scheduling meetings and support pre-planning, execution and schedule critiques
- Identify schedule conflicts, risks and opportunities to improve
- Develop contingency plans and recommend schedule improvements
- Keep schedule reports accurate and communicate status across departments

Qualifications
- High school diploma or GED
- Significant experience building nuclear maintenance, operations or outage schedules
- Strong knowledge of Critical Path Method scheduling
- Experience with nuclear scheduling tools
- Strong communication, organization, problem-solving and computer skills
- Able to work across departments with competing priorities

Desired
- Commercial nuclear power plant experience

Schedule and Duration
Start: ASAP
Duration: About 2–3 years
On-site at Crane Clean Energy Center, Middletown, PA

What We Offer
Medical, dental and vision insurance$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$cbaierski@alliedpwr.com$q$
WHERE id = '06acaffd-d329-4dd0-8599-8d5aa421f301';

-- Mechanical Planner
UPDATE public.employer_jobs SET
  title = $q$Mechanical Planner$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$three-mile-island$q$,
  location = $q$Middletown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = 55,
  salary_max = 75,
  salary_period = $q$hour$q$,
  structured_description = $q${"about":"Develop mechanical work packages for maintenance, surveillances and modifications at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting as soon as possible.","responsibilities":"- Develop mechanical work packages for corrective and preventive maintenance, surveillances and modifications\n- Walk down work in the field to identify scope, materials, procedures, drawings and equipment\n- Coordinate with Work Management, Operations, Engineering, Supply and other site organizations\n- Review work instructions and packages for accuracy, technical rigor, safety and procedure compliance\n- Support permits, plant barrier impairments, regulatory and code documentation, and hold points\n- Develop, revise and review maintenance procedures as needed","qualifications":"- High school diploma or GED\n- 4+ years of mechanical planning experience\n- 5+ years of nuclear power plant experience\n- Experience developing mechanical work packages at a commercial nuclear plant\n- Strong communication, organization and computer skills","desired":"- Asset Suite 9 experience\n- Technical degree","location_details":"Start: ASAP\nDuration: About 2–3 years\nOn-site at Crane Clean Energy Center, Middletown, PA","what_we_offer":"Medical, dental and vision insurance"}$q$::jsonb,
  description = $q$About this Role
Develop mechanical work packages for maintenance, surveillances and modifications at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting as soon as possible.

Responsibilities
- Develop mechanical work packages for corrective and preventive maintenance, surveillances and modifications
- Walk down work in the field to identify scope, materials, procedures, drawings and equipment
- Coordinate with Work Management, Operations, Engineering, Supply and other site organizations
- Review work instructions and packages for accuracy, technical rigor, safety and procedure compliance
- Support permits, plant barrier impairments, regulatory and code documentation, and hold points
- Develop, revise and review maintenance procedures as needed

Qualifications
- High school diploma or GED
- 4+ years of mechanical planning experience
- 5+ years of nuclear power plant experience
- Experience developing mechanical work packages at a commercial nuclear plant
- Strong communication, organization and computer skills

Desired
- Asset Suite 9 experience
- Technical degree

Schedule and Duration
Start: ASAP
Duration: About 2–3 years
On-site at Crane Clean Energy Center, Middletown, PA

What We Offer
Medical, dental and vision insurance$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$cbaierski@alliedpwr.com$q$
WHERE id = 'ad64a97c-1941-43e6-805a-086a1b57ce77';

-- Electrical Planner
UPDATE public.employer_jobs SET
  title = $q$Electrical Planner$q$,
  category = $q$administrative$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = $q$three-mile-island$q$,
  location = $q$Middletown, PA$q$,
  state = $q$pennsylvania$q$,
  salary_min = 55,
  salary_max = 75,
  salary_period = $q$hour$q$,
  structured_description = $q${"about":"Develop electrical work packages for maintenance, surveillances and modifications at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting immediately.","responsibilities":"- Develop and maintain electrical work packages for corrective and preventive maintenance, surveillances and modifications\n- Walk down work in the field to identify scope, equipment, materials, drawings and procedures\n- Coordinate with Work Management, Operations, Engineering, Supply and other site organizations\n- Review work instructions and packages for accuracy, technical rigor, safety and procedure compliance\n- Support permits, plant barrier impairments, regulatory and code documentation, and hold points\n- Develop, revise and review maintenance procedures as needed","qualifications":"- High school diploma or GED\n- 4+ years of electrical planning experience\n- 5+ years of nuclear power plant experience\n- Experience developing electrical work packages at a commercial nuclear plant\n- Strong communication, organization and computer skills","desired":"- Asset Suite experience\n- Technical degree","location_details":"Start: Immediately\nDuration: About 2–3 years\nOn-site at Crane Clean Energy Center, Middletown, PA","what_we_offer":"Medical, dental and vision insurance"}$q$::jsonb,
  description = $q$About this Role
Develop electrical work packages for maintenance, surveillances and modifications at Crane Clean Energy Center (formerly Three Mile Island). This is a long-term assignment of roughly two to three years, starting immediately.

Responsibilities
- Develop and maintain electrical work packages for corrective and preventive maintenance, surveillances and modifications
- Walk down work in the field to identify scope, equipment, materials, drawings and procedures
- Coordinate with Work Management, Operations, Engineering, Supply and other site organizations
- Review work instructions and packages for accuracy, technical rigor, safety and procedure compliance
- Support permits, plant barrier impairments, regulatory and code documentation, and hold points
- Develop, revise and review maintenance procedures as needed

Qualifications
- High school diploma or GED
- 4+ years of electrical planning experience
- 5+ years of nuclear power plant experience
- Experience developing electrical work packages at a commercial nuclear plant
- Strong communication, organization and computer skills

Desired
- Asset Suite experience
- Technical degree

Schedule and Duration
Start: Immediately
Duration: About 2–3 years
On-site at Crane Clean Energy Center, Middletown, PA

What We Offer
Medical, dental and vision insurance$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$cbaierski@alliedpwr.com$q$
WHERE id = 'add6f628-166f-4fc9-87fa-55d4617d1699';

-- Electrical Engineer (Levels 1–3)
UPDATE public.employer_jobs SET
  title = $q$Electrical Engineer (Levels 1–3)$q$,
  category = $q$engineering$q$,
  employment_type = $q$contract$q$,
  work_mode = $q$on-site$q$,
  plant_id = NULL,
  location = $q$Richland, WA$q$,
  state = $q$washington$q$,
  salary_min = NULL,
  salary_max = NULL,
  salary_period = NULL,
  structured_description = $q${"about":"SGS Consulting is hiring electrical engineers at three levels for a new nuclear facility project in Richland, Washington. The work covers design, engineering, installation, testing, commissioning and startup of the facility's electrical systems.\n\nCandidates should have electrical engineering experience in nuclear, power generation, industrial, utility or other highly regulated settings, and be comfortable working on-site in a startup environment.","responsibilities":"- Perform electrical design and analysis for new nuclear project systems and facilities\n- Develop and review electrical calculations, specifications, drawings and technical documentation\n- Support electrical distribution, power systems, equipment, controls and related infrastructure\n- Review designs for compliance with applicable codes, standards and project requirements\n- Coordinate with engineering, construction, commissioning and startup teams\n- Support equipment selection, procurement specifications and technical evaluations\n- Take part in design reviews, field walkdowns, construction support, testing and commissioning\n- Troubleshoot electrical issues and give technical recommendations\n- Review vendor drawings, calculations and technical submittals\n- Make sure work meets quality, safety, regulatory and nuclear-industry requirements\n- Support project documentation and configuration management","qualifications":"All levels:\n- Bachelor's degree in electrical engineering or a related discipline, or equivalent experience\n- Able to read and interpret engineering drawings and technical documents\nLevel 1 – Junior Electrical Engineer:\n- Up to about 2 years of relevant engineering experience\n- Strong fundamentals in electrical engineering and power systems\nLevel 2 – Electrical Engineer:\n- About 2–5 years of relevant engineering experience\n- Experience with electrical systems, engineering calculations, design or analysis\nLevel 3 – Senior Electrical Engineer:\n- 5+ years of relevant engineering experience\n- Strong electrical design and analysis experience\n- Able to resolve complex technical issues independently and coordinate engineering work","desired":"- Nuclear power or new nuclear project experience\n- Electrical power distribution and protection\n- Medium- and low-voltage electrical systems\n- Engineering calculations and technical specifications\n- AutoCAD, ETAP, SKM or similar tools\n- Familiarity with NRC, DOE, IEEE, NFPA and NEC standards\n- Construction, commissioning or startup support\n- Strong technical writing and documentation","location_details":"On-site in Richland, WA"}$q$::jsonb,
  description = $q$About this Role
SGS Consulting is hiring electrical engineers at three levels for a new nuclear facility project in Richland, Washington. The work covers design, engineering, installation, testing, commissioning and startup of the facility's electrical systems.

Candidates should have electrical engineering experience in nuclear, power generation, industrial, utility or other highly regulated settings, and be comfortable working on-site in a startup environment.

Responsibilities
- Perform electrical design and analysis for new nuclear project systems and facilities
- Develop and review electrical calculations, specifications, drawings and technical documentation
- Support electrical distribution, power systems, equipment, controls and related infrastructure
- Review designs for compliance with applicable codes, standards and project requirements
- Coordinate with engineering, construction, commissioning and startup teams
- Support equipment selection, procurement specifications and technical evaluations
- Take part in design reviews, field walkdowns, construction support, testing and commissioning
- Troubleshoot electrical issues and give technical recommendations
- Review vendor drawings, calculations and technical submittals
- Make sure work meets quality, safety, regulatory and nuclear-industry requirements
- Support project documentation and configuration management

Qualifications
All levels:
- Bachelor's degree in electrical engineering or a related discipline, or equivalent experience
- Able to read and interpret engineering drawings and technical documents
Level 1 – Junior Electrical Engineer:
- Up to about 2 years of relevant engineering experience
- Strong fundamentals in electrical engineering and power systems
Level 2 – Electrical Engineer:
- About 2–5 years of relevant engineering experience
- Experience with electrical systems, engineering calculations, design or analysis
Level 3 – Senior Electrical Engineer:
- 5+ years of relevant engineering experience
- Strong electrical design and analysis experience
- Able to resolve complex technical issues independently and coordinate engineering work

Desired
- Nuclear power or new nuclear project experience
- Electrical power distribution and protection
- Medium- and low-voltage electrical systems
- Engineering calculations and technical specifications
- AutoCAD, ETAP, SKM or similar tools
- Familiarity with NRC, DOE, IEEE, NFPA and NEC standards
- Construction, commissioning or startup support
- Strong technical writing and documentation

Schedule and Duration
On-site in Richland, WA$q$,
  application_type = $q$form$q$,
  application_url = NULL,
  application_email = $q$abhishek.rai@sgsconsulting.com$q$
WHERE id = '575db7f1-c1b0-4d54-bbf2-ac7acdd09ec1';

-- Company boilerplate moves out of every listing and onto the company profile.
UPDATE public.employer_profiles SET
  company_description = $q$Service-Disabled Veteran-Owned staff augmentation firm placing engineers, project managers and site support staff at North American nuclear plants. NPower Solutions is an equal opportunity employer.$q$,
  company_website = COALESCE(company_website, 'https://npwrsolutions.com/')
WHERE company_slug IN ('npower-solutions', 'npower-solutions-llc');

COMMIT;
