from django.contrib import admin
from vida.vida.models import Person, Shelter, Track, Form, Report, Note
import uuid
import helpers


class NoteInline(admin.StackedInline):
    model = Report.notes.through
    fields = ['note']
    extra = 0

class NoteAdmin(admin.ModelAdmin):
    model = Note
    fields = ['note', 'author', 'created']

class TrackAdmin(admin.ModelAdmin):
    fields = ['user', 'mayday', 'geom']
    list_display = ('user', 'timestamp', 'mayday', 'geom')
    search_fields = ['user', 'timestamp', 'mayday', 'geom']
    readonly_fields = ('timestamp',)

admin.site.register(Track, TrackAdmin)

class FormAdmin(admin.ModelAdmin):
    fields = ['user', 'schema', 'color', 'emails']
    list_display = ('user', 'timestamp', 'schema', 'color')
    search_fields = ['user', 'timestamp', 'schema', 'color']
    readonly_fields = ('timestamp',)

admin.site.register(Note, NoteAdmin)
admin.site.register(Form, FormAdmin)

class ReportAdmin(admin.ModelAdmin):
    fields = ['user', 'form', 'data', 'geom', 'status']
    list_display = ('user', 'timestamp', 'form', 'data', 'geom', 'status')
    search_fields = ['user', 'timestamp', 'form', 'data', 'geom', 'status']
    readonly_fields = ('timestamp',)
    inlines = [NoteInline]

admin.site.register(Report, ReportAdmin)

class PersonAdmin(admin.ModelAdmin):
    fields = ['created_by', 'shelter_id', 'family_name', 'given_name', 'gender', 'age', 'description', 'street_and_number', 'city', 'province_or_state', 'neighborhood', 'notes', 'barcode']
    list_display = ('given_name', 'family_name', 'gender', 'age', 'created_by')
    search_fields = ['given_name', 'family_name', 'notes', 'barcode']

admin.site.register(Person, PersonAdmin)

class ShelterAdmin(admin.ModelAdmin):
    actions = ['delete_selected']
    fields = ['created_by', 'name', 'description', 'street_and_number', 'city', 'province_or_state', 'neighborhood', 'notes', 'geom']
    list_display = ('name', 'created_by', 'neighborhood')
    search_fields = ['name', 'street_and_number', 'city', 'province_or_state', 'neighborhood', 'uuid']

    def save_model(self, request, obj, form, change):
        obj.uuid = str(uuid.uuid4()).decode('unicode-escape') # Make new uuid for shelter
        obj.site_details = str('http://' + helpers.get_network_ip('eth1') + '/shelters/')
        return super(ShelterAdmin, self).save_model(request, obj, form, change)

    def response_post_save_add(self, request, obj):
        obj.site_details += str(obj.id) + '/'
        obj.save() # This adds the ID after the save, because Django doesn't have the ID field before creation
        return super(ShelterAdmin, self).response_post_save_add(request, obj)

    def delete_selected(self, request, obj):
        for shelter in obj.all(): # All selected shelters
            for i, person in enumerate(Person.objects.all()): # Find whoever (people) had that shelter uuid (optimize?)
                if person.shelter_id == shelter.uuid:
                     person.shelter_id = ''.decode('unicode-escape')  # Shelter has been removed, no need for them to hold shelterID anymore
                     person.save()
            shelter.delete()

admin.site.register(Shelter, ShelterAdmin)